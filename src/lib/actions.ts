'use server';

import { revalidatePath } from 'next/cache';
import { formCompletionNotification } from '@/ai/flows/form-completion-notification';
import { projectSchema, type ProjectFormData } from '@/lib/schemas';
import { QUESTIONS } from '@/lib/questions';
import { supabaseServer } from '@/lib/supabase/server';
import {
  fetchProjectWithRecipients,
  fetchRecipientById,
  fetchRecipientsByProjectId,
  fetchSubmissionsByProjectId,
  sanitizeQuestions,
} from '@/lib/supabase/projects';
import type { Project, Submission } from '@/types';
import type { Answer } from '@/lib/types';
import type { JsonArray } from '@/types';

const normalizeAnswerArray = (value: unknown): Answer[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const answers: Answer[] = [];

  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const record = item as Record<string, unknown>;
    const questionId = typeof record.questionId === 'string' ? record.questionId : undefined;
    if (!questionId) {
      continue;
    }

    const answer: Answer = {
      questionId,
    };

    if (typeof record.textAnswer === 'string') {
      answer.textAnswer = record.textAnswer;
    }

    if (typeof record.fileAnswer === 'string') {
      answer.fileAnswer = record.fileAnswer;
    }

    answers.push(answer);
  }

  return answers;
};

const toJsonArray = (value: unknown): JsonArray => normalizeAnswerArray(value) as JsonArray;

export async function createOrUpdateProject(data: ProjectFormData, existingProjectId?: string): Promise<Project> {
  const supabase = await supabaseServer();
  const validatedData = projectSchema.parse(data);
  const allQuestionIds = QUESTIONS.map(q => q.id);

  try {
    if (existingProjectId) {
      const existingRecipients = await fetchRecipientsByProjectId(existingProjectId);

      const { error: updateProjectError } = await supabase
        .from('projects')
        .update({
          project_name: validatedData.projectName,
          client_name: validatedData.clientName,
        })
        .eq('id', existingProjectId);

      if (updateProjectError) {
        throw new Error(updateProjectError.message);
      }

      const recipientPayload = validatedData.recipients.map(recipient => {
        const existingRecipient = existingRecipients.find(r => r.id === recipient.id);
        const existingQuestions = existingRecipient ? sanitizeQuestions(existingRecipient.questions) : [];
        const providedQuestions = Array.isArray(recipient.questions) ? sanitizeQuestions(recipient.questions) : [];
        const questions = providedQuestions.length > 0
          ? providedQuestions
          : existingQuestions.length > 0
            ? existingQuestions
            : allQuestionIds;
        const status = existingRecipient?.status ?? recipient.status ?? 'pendente';

        return {
          id: recipient.id,
          project_id: existingProjectId,
          name: recipient.name,
          position: recipient.position,
          email: recipient.email,
          status,
          questions,
        };
      });

      if (recipientPayload.length > 0) {
        const { error: upsertRecipientsError } = await supabase
          .from('recipients')
          .upsert(recipientPayload, { onConflict: 'id' });

        if (upsertRecipientsError) {
          throw new Error(upsertRecipientsError.message);
        }
      }

      const currentRecipientIds = new Set(existingRecipients.map(r => r.id));
      const nextRecipientIds = new Set(validatedData.recipients.map(r => r.id));
      const removedRecipientIds = [...currentRecipientIds].filter(id => !nextRecipientIds.has(id));

      if (removedRecipientIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('recipients')
          .delete()
          .in('id', removedRecipientIds);

        if (deleteError) {
          throw new Error(deleteError.message);
        }
      }

      const project = await fetchProjectWithRecipients(existingProjectId);
      if (!project) {
        throw new Error('Project not found');
      }

      revalidatePath('/');
      return project;
    }

    const { data: insertedProject, error: insertProjectError } = await supabase
      .from('projects')
      .insert({
        project_name: validatedData.projectName,
        client_name: validatedData.clientName,
        status: 'rascunho',
      })
      .select('id')
      .single();

    if (insertProjectError || !insertedProject) {
      throw new Error(insertProjectError?.message ?? 'Projeto não criado');
    }

    const projectId = insertedProject.id as string;

    const recipientPayload = validatedData.recipients.map(recipient => ({
      id: recipient.id,
      project_id: projectId,
      name: recipient.name,
      position: recipient.position,
      email: recipient.email,
      status: recipient.status ?? 'pendente',
      questions:
        Array.isArray(recipient.questions) && recipient.questions.length > 0
          ? sanitizeQuestions(recipient.questions)
          : allQuestionIds,
    }));

    if (recipientPayload.length > 0) {
      const { error: insertRecipientsError } = await supabase
        .from('recipients')
        .insert(recipientPayload);

      if (insertRecipientsError) {
        throw new Error(insertRecipientsError.message);
      }
    }

    const project = await fetchProjectWithRecipients(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    revalidatePath('/');
    return project;
  } catch (error) {
    console.error('Failed to save project:', error);
    throw new Error('Não foi possível salvar o projeto.');
  }
}

export async function updateProjectQuestions(projectId: string, recipientId: string, questions: string[]): Promise<Project> {
  const supabase = await supabaseServer();
  const sanitizedQuestions = sanitizeQuestions(questions);

  try {
    const { error } = await supabase
      .from('recipients')
      .update({ questions: sanitizedQuestions })
      .eq('project_id', projectId)
      .eq('id', recipientId);

    if (error) {
      throw new Error(error.message);
    }

    const project = await fetchProjectWithRecipients(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    revalidatePath('/');
    return project;
  } catch (error) {
    console.error('Failed to update project questions:', error);
    throw new Error('Não foi possível atualizar as perguntas.');
  }
}

export async function markSingleEmailAsSent(projectId: string, recipientId: string): Promise<Project> {
  const supabase = await supabaseServer();

  try {
    const recipient = await fetchRecipientById(projectId, recipientId);
    if (!recipient) {
      throw new Error('Recipient not found');
    }

    const hasQuestions = sanitizeQuestions(recipient.questions).length > 0;

    if (hasQuestions) {
      const { error: updateRecipientError } = await supabase
        .from('recipients')
        .update({ status: 'enviado' })
        .eq('project_id', projectId)
        .eq('id', recipientId);

      if (updateRecipientError) {
        throw new Error(updateRecipientError.message);
      }
    }

    let project = await fetchProjectWithRecipients(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const hasSentEmails = project.recipients.some(r => r.status === 'enviado' || r.status === 'concluido');

    if (hasSentEmails && project.status === 'rascunho') {
      const { error: updateProjectError } = await supabase
        .from('projects')
        .update({ status: 'em_andamento' })
        .eq('id', projectId);

      if (updateProjectError) {
        throw new Error(updateProjectError.message);
      }

      project = await fetchProjectWithRecipients(projectId);
      if (!project) {
        throw new Error('Project not found after status update');
      }
    }

    revalidatePath('/');
    return project;
  } catch (error) {
    console.error('Failed to mark email as sent:', error);
    throw new Error('Não foi possível marcar o e-mail como enviado.');
  }
}

export async function submitResponse(submission: Submission) {
  const supabase = await supabaseServer();

  try {
    const { data: existingSubmission, error: fetchSubmissionError } = await supabase
      .from('submissions')
      .select('id')
      .eq('project_id', submission.projectId)
      .eq('recipient_id', submission.recipientId)
      .maybeSingle();

    if (fetchSubmissionError) {
      throw new Error(fetchSubmissionError.message);
    }

    if (existingSubmission) {
      const { error: updateSubmissionError } = await supabase
        .from('submissions')
        .update({ answers: submission.answers })
        .eq('id', existingSubmission.id);

      if (updateSubmissionError) {
        throw new Error(updateSubmissionError.message);
      }
    } else {
      const { error: insertSubmissionError } = await supabase
        .from('submissions')
        .insert({
          project_id: submission.projectId,
          recipient_id: submission.recipientId,
          answers: submission.answers,
        });

      if (insertSubmissionError) {
        throw new Error(insertSubmissionError.message);
      }
    }

    const { error: updateRecipientError } = await supabase
      .from('recipients')
      .update({ status: 'concluido' })
      .eq('project_id', submission.projectId)
      .eq('id', submission.recipientId);

    if (updateRecipientError) {
      throw new Error(updateRecipientError.message);
    }

    let project = await fetchProjectWithRecipients(submission.projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const submissionRows = await fetchSubmissionsByProjectId(submission.projectId);

    const allCompleted = project.recipients.every(recipient => {
      const questions = Array.isArray(recipient.questions)
        ? (recipient.questions as string[])
        : sanitizeQuestions(recipient.questions);
      return recipient.status === 'concluido' || questions.length === 0;
    });

    if (allCompleted) {
      const submissionsByRecipient = new Map<string, Answer[]>();
      for (const row of submissionRows) {
        submissionsByRecipient.set(row.recipient_id, normalizeAnswerArray(row.answers));
      }

      const responses = project.recipients.reduce<Record<string, unknown>>((acc, recipient) => {
        const answersForRecipient = submissionsByRecipient.get(recipient.id) ?? [];
        if (answersForRecipient.length > 0) {
          acc[recipient.email] = answersForRecipient.reduce<Record<string, unknown>>((answerAcc, answer) => {
            if (answer.questionId) {
              answerAcc[answer.questionId] = answer.textAnswer ?? answer.fileAnswer ?? 'Não respondido';
            }
            return answerAcc;
          }, {});
        } else {
          acc[recipient.email] = 'Nenhuma submissão';
        }
        return acc;
      }, {});

      let notificationPayload: { message: string; isComprehensive: boolean };

      try {
        const notification = await formCompletionNotification({
          projectName: project.projectName,
          clientName: project.clientName,
          recipientEmails: project.recipients.map(r => r.email),
          responses,
        });

        notificationPayload = {
          message: notification.notificationMessage,
          isComprehensive: notification.isComprehensive,
        };
      } catch (notificationError) {
        console.error('Error generating AI notification:', notificationError);
        notificationPayload = {
          message: 'Falha ao gerar a análise de completude das respostas.',
          isComprehensive: false,
        };
      }

      const { error: updateProjectError } = await supabase
        .from('projects')
        .update({
          status: 'concluido',
          notification: notificationPayload,
        })
        .eq('id', submission.projectId);

      if (updateProjectError) {
        throw new Error(updateProjectError.message);
      }

      project = await fetchProjectWithRecipients(submission.projectId);
      if (!project) {
        throw new Error('Project not found after finalization');
      }
    }

    revalidatePath('/');
    return { success: true, project };
  } catch (error) {
    console.error('Failed to submit response:', error);
    throw new Error('Não foi possível enviar suas respostas.');
  }
}

export async function getSubmissions(projectId: string): Promise<Record<string, Submission>> {
  try {
    const rows = await fetchSubmissionsByProjectId(projectId);
    return rows.reduce<Record<string, Submission>>((acc, row) => {
      acc[`${row.project_id}_${row.recipient_id}`] = {
        projectId: row.project_id,
        recipientId: row.recipient_id,
        answers: toJsonArray(row.answers),
      };
      return acc;
    }, {});
  } catch (error) {
    console.error('Failed to fetch submissions:', error);
    throw new Error('Não foi possível carregar as submissões.');
  }
}
