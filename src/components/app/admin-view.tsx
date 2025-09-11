"use client";

import { useState, useTransition } from 'react';
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
import { createOrUpdateProject, updateProjectQuestions, markSingleEmailAsSent } from '@/lib/actions';
import { projectSchema, type ProjectFormData } from '@/lib/schemas';
import type { Project, Recipient } from '@/lib/types';
import { QUESTIONS } from '@/lib/questions';
import { PlusCircle, Trash2, Send, Mail, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { groupBy } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface AdminViewProps {
  project: Project | null;
  onProjectChange: (project: Project) => void;
}

export default function AdminView({ project, onProjectChange }: AdminViewProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("definition");
  const allQuestionIds = QUESTIONS.map(q => q.id);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: project ? {
      projectName: project.projectName,
      clientName: project.clientName,
      recipients: project.recipients,
    } : {
      projectName: '',
      clientName: '',
      recipients: [{ id: uuidv4(), name: '', position: '', email: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "recipients",
  });

  const onSubmit = (data: ProjectFormData) => {
    startTransition(async () => {
      try {
        const result = await createOrUpdateProject(data, project?.id);
        onProjectChange(result);
        toast({
          title: "Projeto Salvo!",
          description: "As informações do projeto foram salvas com sucesso.",
          variant: "default",
        });
        setActiveTab("questions");
      } catch (error) {
        toast({
          title: "Erro ao Salvar",
          description: "Não foi possível salvar o projeto. Tente novamente.",
          variant: "destructive",
        });
      }
    });
  };

  const handleQuestionChange = (recipientId: string, questionId: string, checked: boolean) => {
    startTransition(async () => {
      if (!project) return;
      const recipient = project.recipients.find(r => r.id === recipientId);
      if (!recipient) return;
      
      const newQuestions = checked
        ? [...recipient.questions, questionId]
        : recipient.questions.filter(id => id !== questionId);
      
      try {
        const updatedProject = await updateProjectQuestions(project.id, recipientId, newQuestions);
        onProjectChange(updatedProject);
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar as perguntas.",
          variant: "destructive",
        });
      }
    });
  };

  const handleSendEmail = (recipient: Recipient) => {
    if (!project) return;
    startTransition(async () => {
      try {
        const updatedProject = await markSingleEmailAsSent(project.id, recipient.id);
        onProjectChange(updatedProject);
        
        toast({
          title: `E-mail para ${recipient.name} preparado!`,
          description: "Seu cliente de e-mail deve abrir em breve.",
        });

        const subject = `Convite para preenchimento: Relatório ${project.projectName}`;
        const body = `Olá ${recipient.name},\n\nVocê foi convidado(a) para preencher o formulário referente ao projeto "${project.projectName}".\n\nPor favor, acesse o link abaixo para responder às suas perguntas:\n${window.location.origin}?view=recipient&projectId=${project.id}&recipientId=${recipient.id}\n\nObrigado,\nEquipe EnvironPact`;
        const mailtoLink = `mailto:${recipient.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink, '_blank');
      } catch(e) {
         toast({
          title: "Erro ao enviar e-mail",
          description: "Não foi possível marcar o e-mail como enviado.",
          variant: "destructive",
        });
      }
    });
  };

  const questionsByCategory = groupBy(QUESTIONS, 'category');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-4xl mx-auto">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="definition">1. Definição</TabsTrigger>
        <TabsTrigger value="questions" disabled={!project}>2. Perguntas e Envio</TabsTrigger>
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
                            <FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Nome completo" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name={`recipients.${index}.position`} render={({ field }) => (
                            <FormItem><FormLabel>Cargo</FormLabel><FormControl><Input placeholder="Ex: Gerente de Meio Ambiente" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name={`recipients.${index}.email`} render={({ field }) => (
                            <FormItem><FormLabel>E-mail</FormLabel><FormControl><Input type="email" placeholder="email@cliente.com" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                        {fields.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => append({ id: uuidv4(), name: '', position: '', email: '', questions: allQuestionIds, status: 'pending' })}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Destinatário
                    </Button>
                  </div>
                </div>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
              {project?.recipients.map(recipient => (
                <AccordionItem key={recipient.id} value={recipient.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex flex-1 items-center gap-4">
                      <div className="flex flex-col text-left">
                        <span className="font-medium">{recipient.name}</span>
                        <span className="text-sm text-muted-foreground">{recipient.email}</span>
                      </div>
                      {recipient.status === 'sent' && <Badge variant="outline"><Mail className="mr-2 h-3.5 w-3.5" />Enviado</Badge>}
                      {recipient.status === 'completed' && <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="mr-2 h-3.5 w-3.5" />Concluído</Badge>}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-2">
                    <div className="space-y-4">
                      <div className="p-4 border-b">
                        <h4 className="font-medium mb-2 text-primary">Envio de E-mail</h4>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Status:
                                    {recipient.status === 'pending' && <span className="ml-2 font-normal text-muted-foreground">Pendente</span>}
                                    {recipient.status === 'sent' && <span className="ml-2 font-normal text-amber-600">Enviado</span>}
                                    {recipient.status === 'completed' && <span className="ml-2 font-normal text-green-600">Concluído</span>}
                                </p>
                                <p className="text-xs text-muted-foreground">O link do formulário será aberto no seu cliente de e-mail padrão.</p>
                            </div>
                            <Button 
                                size="sm" 
                                onClick={() => handleSendEmail(recipient)}
                                disabled={isPending || recipient.questions.length === 0 || recipient.status === 'completed'}
                            >
                                <Send className="mr-2 h-4 w-4"/>
                                Enviar E-mail
                            </Button>
                        </div>
                      </div>
                      {Object.entries(questionsByCategory).map(([category, questions]) => (
                        <div key={category}>
                          <h4 className="font-medium mb-2 text-primary font-headline">{category}</h4>
                          <div className="space-y-2 pl-2">
                            {questions.map(question => (
                              <div key={question.id} className="flex items-center gap-2">
                                <Checkbox
                                  id={`${recipient.id}-${question.id}`}
                                  checked={recipient.questions.includes(question.id)}
                                  onCheckedChange={(checked) => handleQuestionChange(recipient.id, question.id, !!checked)}
                                />
                                <label htmlFor={`${recipient.id}-${question.id}`} className="text-sm text-muted-foreground cursor-pointer">
                                  {question.text}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
