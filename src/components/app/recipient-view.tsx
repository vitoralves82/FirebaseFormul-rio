"use client";

import { useEffect, useState, useTransition, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Project, Answer, Submission } from '@/lib/types';
import { QUESTIONS } from '@/lib/questions';
import { submitResponse } from '@/lib/actions';
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, Upload, Paperclip, X } from 'lucide-react';
import { groupBy } from '@/lib/utils'; // Assuming you add this helper

interface RecipientViewProps {
  project: Project;
  activeRecipientId: string | null;
  setActiveRecipientId: (id: string) => void;
  isRecipientSession?: boolean;
  onProjectUpdated?: (project: Project) => void;
}

export default function RecipientView({ project, activeRecipientId, setActiveRecipientId, isRecipientSession, onProjectUpdated }: RecipientViewProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const activeRecipient = useMemo(() => project.recipients.find(r => r.id === activeRecipientId), [project, activeRecipientId]);
  const recipientQuestions = useMemo(() => QUESTIONS.filter(q => activeRecipient?.questions.includes(q.id)), [activeRecipient]);
  const questionsByCategory = useMemo(() => groupBy(recipientQuestions, 'category'), [recipientQuestions]);

  useEffect(() => {
    if (!activeRecipientId) return;
    
    // Do not load from localStorage if it's a real recipient session from a link
    if (!isRecipientSession) {
      const saved = localStorage.getItem(`submission_${project.id}_${activeRecipientId}`);
      if (saved) {
        setAnswers(JSON.parse(saved));
      } else {
        setAnswers({});
      }
    } else {
      setAnswers({});
    }

    setIsSubmitted(activeRecipient?.status === 'completed');
  }, [activeRecipientId, project.id, activeRecipient?.status, isRecipientSession]);

  useEffect(() => {
    // Do not save to localStorage if it's a real recipient session
    if (Object.keys(answers).length > 0 && !isSubmitted && !isRecipientSession) {
      localStorage.setItem(`submission_${project.id}_${activeRecipientId}`, JSON.stringify(answers));
    }
  }, [answers, project.id, activeRecipientId, isSubmitted, isRecipientSession]);

  const handleAnswerChange = (questionId: string, value: string | File) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        questionId,
        ...(typeof value === 'string'
          ? { textAnswer: value }
          : { fileAnswer: value.name }) // In a real app, you'd upload the file and store a URL
      }
    }));
  };

  const handleSubmit = () => {
    if (!activeRecipientId) return;

    startTransition(async () => {
      const submission: Submission = {
        projectId: project.id,
        recipientId: activeRecipientId,
        answers: Object.values(answers),
      };

      try {
        const result = await submitResponse(submission);
        if (result?.project && onProjectUpdated) {
          onProjectUpdated(result.project);
        }
        if (!isRecipientSession) {
            localStorage.removeItem(`submission_${project.id}_${activeRecipientId}`);
        }
        setIsSubmitted(true);
        toast({
          title: "Formulário Enviado!",
          description: "Suas respostas foram enviadas com sucesso.",
        });
      } catch (error) {
        toast({
          title: "Erro no Envio",
          description: "Não foi possível enviar suas respostas. Tente novamente.",
          variant: "destructive",
        });
      }
    });
  };
  
  if (!activeRecipient) {
    return <Card><CardContent className="pt-6">Selecione um destinatário para pré-visualizar o formulário.</CardContent></Card>;
  }

  if (isSubmitted) {
    return (
        <Card className="w-full max-w-3xl mx-auto">
            <CardHeader className="text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500"/>
                <CardTitle className="font-headline text-2xl">Obrigado!</CardTitle>
                <CardDescription>Seu formulário foi enviado com sucesso.</CardDescription>
            </CardHeader>
        </Card>
    );
  }

  return (
    <div className="space-y-6">
      {!isRecipientSession && (
        <div className="flex justify-center">
            <div className="w-full max-w-sm">
                <Label>Pré-visualizar como:</Label>
                <Select value={activeRecipientId ?? undefined} onValueChange={setActiveRecipientId}>
                    <SelectTrigger><SelectValue placeholder="Selecione um destinatário..." /></SelectTrigger>
                    <SelectContent>
                    {project.recipients.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.name} - {r.email}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
      )}

      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Formulário: {project.projectName}</CardTitle>
          <CardDescription>
            {isRecipientSession ? `Olá, ${activeRecipient.name}. Por favor, responda às perguntas abaixo.` : `Cliente: ${project.clientName}. Responda às perguntas abaixo.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(questionsByCategory).map(([category, questions]) => (
            <div key={category} className="space-y-4">
              <h3 className="text-lg font-bold text-primary font-headline border-b pb-2">{category}</h3>
              {questions.map((q) => (
                <div key={q.id} className="space-y-2">
                  <Label htmlFor={q.id} className="font-medium">{q.text}</Label>
                  {q.text.toLowerCase().includes('anexe') ? (
                    <div className="w-full">
                      {answers[q.id]?.fileAnswer ? (
                         <div className="flex items-center gap-2 text-sm p-2 bg-muted rounded-md">
                            <Paperclip className="h-4 w-4" />
                            <span>{answers[q.id]?.fileAnswer}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => handleAnswerChange(q.id, '')}>
                                <X className="h-4 w-4" />
                            </Button>
                         </div>
                      ) : (
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor={`file-${q.id}`} className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-background">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground"><span className="font-semibold">Clique para enviar</span> ou arraste e solte</p>
                                </div>
                                <Input id={`file-${q.id}`} type="file" className="hidden" onChange={(e) => e.target.files && handleAnswerChange(q.id, e.target.files[0])} />
                            </label>
                        </div> 
                      )}
                    </div>
                  ) : (
                    <Textarea id={q.id} value={answers[q.id]?.textAnswer || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value)} rows={4} placeholder="Sua resposta..."/>
                  )}
                </div>
              ))}
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Respostas
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
