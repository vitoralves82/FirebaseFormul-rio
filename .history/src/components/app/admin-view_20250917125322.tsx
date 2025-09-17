'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { v4 as uuidv4 } from 'uuid';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { addDestinatarios, createProjeto, listRespostasPorProjeto,
         buildResponderLink, getDestinatarioTokenByEmail} from '@/lib/esgApi';

import { projectSchema, type ProjectFormData } from '@/lib/schemas';
import type { Project, Recipient, Submission } from '@/types';
import type { Answer } from '@/lib/types';
import { QUESTIONS } from '@/lib/questions';
import { PlusCircle, Trash2, Send, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { groupBy } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const getQuestionIds = (questions: Recipient['questions'] | undefined): string[] =>
  Array.isArray(questions) ? questions.filter((value): value is string => typeof value === 'string') : [];

/** Hook para criar projeto + convites no Supabase (lado do cliente) */
export function useSalvarProjetoHook() {
  const [salvando, setSalvando] = useState(false);

  async function salvarProjetoEConvites({
    nomeProjeto,
    nomeCliente,
    destinatariosLista,
  }: {
    nomeProjeto: string; nomeCliente: string;
    destinatariosLista: { nome: string; cargo?: string; email: string; }[];
  }) {
    setSalvando(true);
    try {
      const projeto = await createProjeto({ nome_projeto: nomeProjeto, nome_cliente: nomeCliente });
      await addDestinatarios(projeto.id, destinatariosLista);
      return { ok: true, projetoId: projeto.id };
    } finally {
      setSalvando(false);
    }
  }

  return { salvando, salvarProjetoEConvites };
}

interface AdminViewProps {
  project: Project | null;
  onProjectChange: (project: Project) => void;
}

/** ====== Versões LOCAIS (sem chamadas a /api) ====== */
function updateRecipientQuestionsLocal(p: Project, recipientId: string, questions: string[]) {
  const recipients = p.recipients.map(r =>
    r.id === recipientId ? { ...r, questions } : r
  );
  return { ...p, recipients };
}

function markRecipientEmailAsSentLocal(p: Project, recipientId: string) {
  const recipients = p.recipients.map(r =>
    r.id === recipientId ? { ...r, status: 'enviado' } : r
  );
  return { ...p, recipients };
}

/** Normaliza respostas JSON da tabela `respostas` (Supabase) para o tipo Answer[] do app */
const normalizeRespostasConteudo = (respostas: unknown): Answer[] => {
  if (Array.isArray(respostas)) {
    return respostas.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const record = item as Record<string, unknown>;
      const questionId = typeof record.questionId === 'string' ? record.questionId : undefined;
      if (!questionId) return [];
      const answer: Answer = { questionId };
      if (typeof record.textAnswer === 'string') answer.textAnswer = record.textAnswer;
      if (typeof record.fileAnswer === 'string') answer.fileAnswer = record.fileAnswer;
      return [answer];
    });
  }

  if (respostas && typeof respostas === 'object') {
    return Object.entries(respostas as Record<string, unknown>).reduce<Answer[]>((acc, [questionId, value]) => {
      if (typeof questionId !== 'string' || questionId.length === 0) return acc;
      const answer: Answer = { questionId };
      if (typeof value === 'string') {
        answer.textAnswer = value;
      } else if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>;
        if (typeof record.textAnswer === 'string') answer.textAnswer = record.textAnswer;
        if (typeof record.fileAnswer === 'string') answer.fileAnswer = record.fileAnswer;
      } else if (value !== undefined && value !== null) {
        answer.textAnswer = JSON.stringify(value);
      }
      acc.push(answer);
      return acc;
    }, []);
  }

  return [];
};

async function fetchSubmissionsMap(projectId: string) {
  const respostas = await listRespostasPorProjeto(projectId);
  const submissionsMap: Record<string, Submission> = {};
  respostas.forEach((resposta) => {
    const destinatarioId = resposta.destinatario_id ?? undefined;
    if (!destinatarioId) return;
    const answers = normalizeRespostasConteudo(resposta.respostas_conteudo);
    submissionsMap[`${resposta.projeto_id}_${destinatarioId}`] = {
      projectId: resposta.projeto_id,
      recipientId: destinatarioId,
      answers: answers as unknown as Submission['answers'],
    };
  });
  return submissionsMap;
}

export default function AdminView({ project, onProjectChange }: AdminViewProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState('definition');
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [supabaseProjetoId, setSupabaseProjetoId] = useState<string | null>(null);
  const { salvando, salvarProjetoEConvites } = useSalvarProjetoHook();
  const isSaving = isPending || salvando;
  const allQuestionIds = QUESTIONS.map((q) => q.id);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: project
      ? {
          projectName: project.projectName,
          clientName: project.clientName,
          recipients: project.recipients.map(({ id, name, position, email, status, questions }) => ({
            id, name, position, email, status,
            questions: getQuestionIds(questions),
          })),
        }
      : {
          projectName: '',
          clientName: '',
          recipients: [{ id: uuidv4(), name: '', position: '', email: '' }],
        },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'recipients' });

  /** Persiste/atualiza o "projeto" na rota local /api/projects (stub) */
  const persistProject = async (formData: ProjectFormData) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: formData, projectId: project?.id ?? null }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.project) {
        const message =
          typeof payload?.error === 'string' ? payload.error : 'Não foi possível salvar o projeto.';
        throw new Error(message);
      }

      const result = payload.project as Project;
      onProjectChange(result);

      form.reset({
        projectName: result.projectName,
        clientName: result.clientName,
        recipients: result.recipients.map((recipient) => ({
          id: recipient.id,
          name: recipient.name,
          position: recipient.position,
          email: recipient.email,
          status: recipient.status,
          questions: getQuestionIds(recipient.questions),
        })),
      });

      toast({
        title: 'Projeto Salvo!',
        description: 'As informações do projeto foram salvas com sucesso.',
        variant: 'default',
      });
      setActiveTab('questions');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível salvar o projeto. Tente novamente.';
      toast({ title: 'Erro ao Salvar', description: message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (!project) setSupabaseProjetoId(null);
  }, [project]);

  useEffect(() => {
    if (activeTab === 'responses' && project) {
      startTransition(() => {
        void (async () => {
          try {
            const fetchedSubmissions = await fetchSubmissionsMap(project.id);
            setSubmissions(fetchedSubmissions);
          } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
              // eslint-disable-next-line no-console
              console.error('Falha ao carregar submissões via API client', error);
            }
            toast({
              title: 'Erro ao carregar respostas',
              description: 'Não foi possível carregar as respostas dos destinatários.',
              variant: 'destructive',
            });
          }
        })();
      });
    }
  }, [activeTab, project, toast]);

  const onSubmit = async (data: ProjectFormData) => {
    const destinatariosLista = data.recipients.map((recipient) => ({
      nome: recipient.name,
      cargo: recipient.position,
      email: recipient.email,
    }));

    if (!supabaseProjetoId) {
      try {
        const resultado = await salvarProjetoEConvites({
          nomeProjeto: data.projectName,
          nomeCliente: data.clientName,
          destinatariosLista,
        });
        setSupabaseProjetoId(resultado.projetoId);

        toast({
          title: 'Integração Supabase',
          description: 'Projeto criado e destinatários salvos no Supabase.',
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Falha ao integrar com Supabase.';
        toast({ title: 'Integração Supabase', description: message, variant: 'destructive' });
        return;
      }
    }

    startTransition(() => {
      void persistProject(data);
    });
  };

  const handleQuestionChange = (recipientId: string, questionId: string, checked: boolean) => {
    if (!project) return;

    const recipient = project.recipients.find((r) => r.id === recipientId);
    if (!recipient) return;

    const currentQuestions = getQuestionIds(recipient.questions);
    const newQuestions = checked
      ? [...currentQuestions, questionId]
      : currentQuestions.filter((id) => id !== questionId);

    // Atualiza localmente (sem /api) → evita 500
    const updatedProject = updateRecipientQuestionsLocal(project, recipientId, newQuestions);
    onProjectChange(updatedProject);
  };

  const handleSendEmail = (recipient: Recipient) => {
    if (!project) return;

    // Atualiza status localmente (sem /api)
    const updated = markRecipientEmailAsSentLocal(project, recipient.id);
    onProjectChange(updated);

    toast({
      title: `E-mail para ${recipient.name} preparado!`,
      description: 'Seu cliente de e-mail deve abrir em breve.',
    });

    const subject = `Convite para preenchimento: Relatório ${project.projectName}`;
    const body =
      `Olá ${recipient.name},\n\nVocê foi convidado(a) para preencher o formulário referente ao projeto "${project.projectName}".\n\n` +
      `Por favor, acesse o link abaixo para responder às suas perguntas:\n${window.location.origin}?view=recipient&projectId=${project.id}&recipientId=${recipient.id}\n\nObrigado,\nEquipe EnvironPact`;
    const mailtoLink = `mailto:${recipient.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };

  const getAnswerForQuestion = (recipientId: string, questionId: string): Answer | undefined => {
    if (!project) return undefined;
    const submission = submissions[`${project.id}_${recipientId}`];
    const answers = submission?.answers as Answer[] | undefined;
    return answers?.find((a) => a.questionId === questionId);
  };

  const questionsByCategory = groupBy(QUESTIONS, 'category');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-4xl mx-auto">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="definition">1. Definição</TabsTrigger>
        <TabsTrigger value="questions" disabled={!project}>2. Perguntas e Envio</TabsTrigger>
        <TabsTrigger value="responses" disabled={!project}>3. Consulta de Respostas</TabsTrigger>
      </TabsList>

      <TabsContent value="definition">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Definição do Projeto e Destinatários</CardTitle>
            <CardDescription>Preencha os detalhes do projeto e adicione os destinatários do formulário.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="projectName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Projeto</FormLabel>
                      <FormControl><Input placeholder="Ex: Relatório de Sustentabilidade 2024" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="clientName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Cliente</FormLabel>
                      <FormControl><Input placeholder="Ex: Empresa Exemplo S.A." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4 font-headline">Destinatários</h3>
                  <div className="space-y-6">
                    {fields.map((field, index) => (
                      <div key={field.id} className="p-4 border rounded-lg relative bg-background/50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField control={form.control} name={`recipients.${index}.name`} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome</FormLabel>
                              <FormControl><Input placeholder="Nome completo" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name={`recipients.${index}.position`} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cargo</FormLabel>
                              <FormControl><Input placeholder="Ex: Gerente de Meio Ambiente" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name={`recipients.${index}.email`} render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-mail</FormLabel>
                              <FormControl><Input type="email" placeholder="email@cliente.com" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>

                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        append({ id: uuidv4(), name: '', position: '', email: '', questions: allQuestionIds, status: 'pendente' })
                      }
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Destinatário
                    </Button>
                  </div>
                </div>

                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {project ? 'Atualizar Projeto' : 'Salvar e ir para Perguntas'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="questions">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Seleção de Perguntas e Envio</CardTitle>
            <CardDescription>Selecione as perguntas para cada destinatário e envie os formulários.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Accordion type="multiple" className="w-full">
              {project?.recipients.map((recipient) => {
                const questionIds = getQuestionIds(recipient.questions);
                return (
                  <AccordionItem key={recipient.id} value={recipient.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex flex-1 items-center gap-4">
                        <div className="flex flex-col text-left">
                          <span className="font-medium">{recipient.name}</span>
                          <span className="text-sm text-muted-foreground">{recipient.email}</span>
                        </div>
                        {recipient.status === 'enviado' && <Badge variant="outline"><Mail className="mr-2 h-3.5 w-3.5" />Enviado</Badge>}
                        {recipient.status === 'concluido' && <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="mr-2 h-3.5 w-3.5" />Concluído</Badge>}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-2">
                      <div className="space-y-4">
                        <div className="p-4 border-b">
                          <h4 className="font-medium mb-2 text-primary">Envio de E-mail</h4>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Status:
                                {recipient.status === 'pendente' && <span className="ml-2 font-normal text-muted-foreground">Pendente</span>}
                                {recipient.status === 'enviado' && <span className="ml-2 font-normal text-amber-600">Enviado</span>}
                                {recipient.status === 'concluido' && <span className="ml-2 font-normal text-green-600">Concluído</span>}
                              </p>
                              <p className="text-xs text-muted-foreground">O link do formulário será aberto no seu cliente de e-mail padrão.</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleSendEmail(recipient)}
                              disabled={isPending || questionIds.length === 0 || recipient.status === 'concluido'}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Enviar E-mail
                            </Button>
                          </div>
                        </div>

                        <Accordion type="multiple" className="w-full" defaultValue={Object.keys(questionsByCategory)}>
                          {Object.entries(questionsByCategory).map(([category, questions]) => (
                            <AccordionItem key={category} value={category}>
                              <AccordionTrigger className="text-base font-medium text-primary hover:no-underline font-headline">
                                {category}
                              </AccordionTrigger>
                              <AccordionContent className="p-2">
                                <div className="space-y-3 pl-2">
                                  {questions.map((question) => (
                                    <div key={question.id} className="flex items-start gap-3">
                                      <Checkbox
                                        id={`${recipient.id}-${question.id}`}
                                        checked={questionIds.includes(question.id)}
                                        onCheckedChange={(checked) => handleQuestionChange(recipient.id, question.id, !!checked)}
                                        className="mt-1"
                                      />
                                      <label htmlFor={`${recipient.id}-${question.id}`} className="text-sm text-muted-foreground cursor-pointer">
                                        <span className="font-bold text-foreground">{question.id}</span> - {question.text}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="responses">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Consulta de Respostas</CardTitle>
            <CardDescription>Visualize as perguntas e respostas de cada destinatário.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isPending && (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            {!isPending && (
              <Accordion type="multiple" className="w-full">
                {project?.recipients.map((recipient) => {
                  const questionIds = getQuestionIds(recipient.questions);
                  return (
                    <AccordionItem key={recipient.id} value={recipient.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex flex-1 items-center gap-4">
                          <div className="flex flex-col text-left">
                            <span className="font-medium">{recipient.name}</span>
                            <span className="text-sm text-muted-foreground">{recipient.email}</span>
                          </div>
                          {recipient.status === 'pendente' && <Badge variant="outline"><AlertCircle className="mr-2 h-3.5 w-3.5" />Pendente</Badge>}
                          {recipient.status === 'enviado' && <Badge variant="outline" className="text-amber-600 border-amber-300"><Mail className="mr-2 h-3.5 w-3.5" />Enviado</Badge>}
                          {recipient.status === 'concluido' && <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="mr-2 h-3.5 w-3.5" />Concluído</Badge>}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-2">
                        <div className="space-y-4 pt-4">
                          {questionIds.length > 0 ? (
                            QUESTIONS
                              .filter((q) => questionIds.includes(q.id))
                              .map((question) => {
                                const answer = getAnswerForQuestion(recipient.id, question.id);
                                return (
                                  <div key={question.id} className="grid gap-2 text-sm">
                                    <p className="font-medium text-primary">{question.text}</p>
                                    {answer ? (
                                      <p className="p-3 bg-muted rounded-md text-muted-foreground">
                                        {answer.textAnswer || answer.fileAnswer || 'Não respondido'}
                                      </p>
                                    ) : (
                                      <p className="p-3 bg-yellow-50 text-yellow-700 rounded-md">Pendente</p>
                                    )}
                                  </div>
                                );
                              })
                          ) : (
                            <p className="text-muted-foreground text-sm">Nenhuma pergunta atribuída a este destinatário.</p>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
