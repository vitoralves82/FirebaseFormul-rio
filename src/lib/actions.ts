'use server';

import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import { formCompletionNotification } from '@/ai/flows/form-completion-notification';
import { projectSchema, type ProjectFormData } from '@/lib/schemas';
import { QUESTIONS } from '@/lib/questions';
import type { Answer, Project, Recipient, Submission } from '@/lib/types';
import { supabaseRequest } from '@/lib/supabase/client';
import type {
  SupabaseProjectRow,
  SupabaseRecipientRow,
  SupabaseSubmissionRow,
} from '@/lib/supabase/types';

const PREFER_RETURN = ['return=representation'];
const PREFER_UPSERT = ['return=representation', 'resolution=merge-duplicates'];

function sanitizeQuestions(questions: string[] | undefined, fallback: string[]): string[] {
  if (!questions || questions.length === 0) {
    return fallback;
  }

  const filtered = questions.filter(questionId => questionId && fallback.includes(questionId));
  const unique = Array.from(new Set(filtered));

  return unique.length > 0 ? unique : fallback;
}

function mapRecipient(row: SupabaseRecipientRow): Recipient {
  return {
    id: row.id,
    name: row.name,
    position: row.position,
    email: row.email,
    questions: Array.isArray(row.questions) ? row.questions : [],
    status: row.status,
  };
}

function mapProject(row: SupabaseProjectRow, recipients: SupabaseRecipientRow[]): Project {
  const orderedRecipients = [...recipients]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(mapRecipient);

  const notification = row.notification_message
    ? {
        message: row.notification_message,
        isComprehensive: Boolean(row.notification_is_comprehensive),
      }
    : undefined;

  return {
    id: row.id,
    projectName: row.project_name,
    clientName: row.client_name,
    status: row.status,
    recipients: orderedRecipients,
    ...(notification ? { notification } : {}),
  };
}

async function fetchProjectRow(projectId: string): Promise<SupabaseProjectRow> {
  const rows = await supabaseRequest<SupabaseProjectRow[]>(`projects`, {
    searchParams: {
      select: 'id,project_name,client_name,status,notification_message,notification_is_comprehensive',
      id: `eq.${projectId}`,
    },
  });

  const projectRow = rows?.[0];
  if (!projectRow) {
    throw new Error('Projeto não encontrado');
  }

  return projectRow;
}

async function fetchProject(projectId: string): Promise<Project> {
  const projectRow = await fetchProjectRow(projectId);
  const recipientRows = await supabaseRequest<SupabaseRecipientRow[]>(`recipients`, {
    searchParams: {
      select: 'id,project_id,name,position,email,questions,status,created_at',
      project_id: `eq.${projectId}`,
    },
  });

  return mapProject(projectRow, recipientRows ?? []);
}

export async function getProjectById(projectId: string): Promise<Project | null> {
  try {
    return await fetchProject(projectId);
  } catch (error) {
    if (error instanceof Error && error.message === 'Projeto não encontrado') {
      return null;
    }
    throw error;
  }
}

export async function createOrUpdateProject(data: ProjectFormData, existingProjectId?: string) {
  const validatedData = projectSchema.parse(data);
  const allQuestionIds = QUESTIONS.map(q => q.id);

  if (existingProjectId) {
    const updatedProjects = await supabaseRequest<SupabaseProjectRow[]>(`projects`, {
      method: 'PATCH',
      searchParams: { id: `eq.${existingProjectId}` },
      body: {
        project_name: validatedData.projectName,
        client_name: validatedData.clientName,
      },
      prefer: PREFER_RETURN,
    });

    if (!updatedProjects || updatedProjects.length === 0) {
      throw new Error('Projeto não encontrado');
    }

    const existingRecipientRows = await supabaseRequest<Pick<SupabaseRecipientRow, 'id' | 'status' | 'questions'>[]>(`recipients`, {
      searchParams: {
        select: 'id,status,questions',
        project_id: `eq.${existingProjectId}`,
      },
    });

    const existingRecipientMap = new Map(
      (existingRecipientRows ?? []).map(row => [row.id, row])
    );

    const recipientsPayload = validatedData.recipients.map(recipient => {
      const existing = existingRecipientMap.get(recipient.id);
      const questions = sanitizeQuestions(recipient.questions ?? existing?.questions ?? undefined, allQuestionIds);

      return {
        id: recipient.id || existing?.id || uuidv4(),
        project_id: existingProjectId,
        name: recipient.name,
        position: recipient.position,
        email: recipient.email,
        questions,
        status: recipient.status ?? existing?.status ?? 'pending',
      };
    });

    const incomingIds = new Set(recipientsPayload.map(r => r.id));
    const idsToDelete = (existingRecipientRows ?? [])
      .filter(row => !incomingIds.has(row.id))
      .map(row => row.id);

    if (idsToDelete.length > 0) {
      const values = idsToDelete.map(id => `"${id}"`).join(',');
      await supabaseRequest(`recipients`, {
        method: 'DELETE',
        searchParams: { id: `in.(${values})` },
      });
    }

    if (recipientsPayload.length > 0) {
      await supabaseRequest(`recipients`, {
        method: 'POST',
        body: recipientsPayload,
        prefer: PREFER_UPSERT,
      });
    }

    revalidatePath('/');
    return fetchProject(existingProjectId);
  }

  const insertedProjects = await supabaseRequest<SupabaseProjectRow[]>(`projects`, {
    method: 'POST',
    body: {
      project_name: validatedData.projectName,
      client_name: validatedData.clientName,
      status: 'draft',
    },
    prefer: PREFER_RETURN,
  });

  const projectRow = insertedProjects?.[0];
  if (!projectRow) {
    throw new Error('Não foi possível criar o projeto.');
  }

  const projectId = projectRow.id;

  if (validatedData.recipients.length > 0) {
    const recipientsPayload = validatedData.recipients.map(recipient => ({
      id: recipient.id || uuidv4(),
      project_id: projectId,
      name: recipient.name,
      position: recipient.position,
      email: recipient.email,
      questions: sanitizeQuestions(recipient.questions, allQuestionIds),
      status: recipient.status ?? 'pending',
    }));

    await supabaseRequest(`recipients`, {
      method: 'POST',
      body: recipientsPayload,
      prefer: PREFER_RETURN,
    });
  }

  revalidatePath('/');
  return fetchProject(projectId);
}

export async function updateProjectQuestions(projectId: string, recipientId: string, questions: string[]) {
  const sanitized = sanitizeQuestions(questions, QUESTIONS.map(q => q.id));

  const updatedRecipients = await supabaseRequest<SupabaseRecipientRow[]>(`recipients`, {
    method: 'PATCH',
    searchParams: {
      id: `eq.${recipientId}`,
      project_id: `eq.${projectId}`,
    },
    body: { questions: sanitized },
    prefer: PREFER_RETURN,
  });

  if (!updatedRecipients || updatedRecipients.length === 0) {
    throw new Error('Destinatário não encontrado');
  }

  revalidatePath('/');
  return fetchProject(projectId);
}

export async function markSingleEmailAsSent(projectId: string, recipientId: string) {
  const recipientRows = await supabaseRequest<Pick<SupabaseRecipientRow, 'id' | 'status' | 'questions'>[]>(`recipients`, {
    searchParams: {
      select: 'id,status,questions',
      id: `eq.${recipientId}`,
      project_id: `eq.${projectId}`,
    },
  });

  const recipient = recipientRows?.[0];
  if (!recipient) {
    throw new Error('Destinatário não encontrado');
  }

  if (!recipient.questions || recipient.questions.length === 0) {
    return fetchProject(projectId);
  }

  if (recipient.status !== 'completed') {
    await supabaseRequest(`recipients`, {
      method: 'PATCH',
      searchParams: {
        id: `eq.${recipientId}`,
        project_id: `eq.${projectId}`,
      },
      body: { status: 'sent' },
      prefer: PREFER_RETURN,
    });
  }

  const recipients = await supabaseRequest<Pick<SupabaseRecipientRow, 'status' | 'questions'>[]>(`recipients`, {
    searchParams: {
      select: 'status,questions',
      project_id: `eq.${projectId}`,
    },
  });

  const hasSentEmails = (recipients ?? []).some(row => row.status === 'sent' || row.status === 'completed');

  if (hasSentEmails) {
    const projectRows = await supabaseRequest<Pick<SupabaseProjectRow, 'status'>[]>(`projects`, {
      searchParams: {
        select: 'status',
        id: `eq.${projectId}`,
      },
    });

    const projectRow = projectRows?.[0];
    if (projectRow && projectRow.status === 'draft') {
      await supabaseRequest(`projects`, {
        method: 'PATCH',
        searchParams: { id: `eq.${projectId}` },
        body: { status: 'in-progress' },
        prefer: PREFER_RETURN,
      });
    }
  }

  revalidatePath('/');
  return fetchProject(projectId);
}

export async function submitResponse(submission: Submission) {
  const sanitizedAnswers: Answer[] = submission.answers.map(answer => ({
    questionId: answer.questionId,
    textAnswer: answer.textAnswer ?? undefined,
    fileAnswer: answer.fileAnswer ?? undefined,
  }));

  const projectRow = await fetchProjectRow(submission.projectId);

  await supabaseRequest(`submissions`, {
    method: 'POST',
    body: [
      {
        project_id: submission.projectId,
        recipient_id: submission.recipientId,
        answers: sanitizedAnswers,
        submitted_at: new Date().toISOString(),
      },
    ],
    prefer: PREFER_UPSERT,
  });

  await supabaseRequest(`recipients`, {
    method: 'PATCH',
    searchParams: {
      id: `eq.${submission.recipientId}`,
      project_id: `eq.${submission.projectId}`,
    },
    body: { status: 'completed' },
    prefer: PREFER_RETURN,
  });

  const recipientRows = await supabaseRequest<Pick<SupabaseRecipientRow, 'id' | 'email' | 'status' | 'questions'>[]>(`recipients`, {
    searchParams: {
      select: 'id,email,status,questions',
      project_id: `eq.${submission.projectId}`,
    },
  });

  const allCompleted = (recipientRows ?? []).every(row => {
    const hasQuestions = row.questions && row.questions.length > 0;
    return row.status === 'completed' || !hasQuestions;
  });

  const projectUpdates: Record<string, unknown> = {};

  if (allCompleted) {
    const submissionRows = await supabaseRequest<Pick<SupabaseSubmissionRow, 'recipient_id' | 'answers'>[]>(`submissions`, {
      searchParams: {
        select: 'recipient_id,answers',
        project_id: `eq.${submission.projectId}`,
      },
    });

    const responses = (recipientRows ?? []).reduce((acc, recipient) => {
      const submissionRow = submissionRows.find(row => row.recipient_id === recipient.id);
      if (submissionRow?.answers) {
        acc[recipient.email] = submissionRow.answers.reduce((answersAcc, answer) => {
          answersAcc[answer.questionId] = answer.textAnswer ?? answer.fileAnswer ?? 'Não respondido';
          return answersAcc;
        }, {} as Record<string, unknown>);
      } else {
        acc[recipient.email] = 'Nenhuma submissão';
      }
      return acc;
    }, {} as Record<string, unknown>);

    try {
      const notification = await formCompletionNotification({
        projectName: projectRow.project_name,
        clientName: projectRow.client_name,
        recipientEmails: (recipientRows ?? []).map(row => row.email),
        responses,
      });

      projectUpdates.status = 'completed';
      projectUpdates.notification_message = notification.notificationMessage;
      projectUpdates.notification_is_comprehensive = notification.isComprehensive;
    } catch (error) {
      console.error('Erro ao gerar a notificação de IA:', error);
      projectUpdates.status = 'completed';
      projectUpdates.notification_message = 'Falha ao gerar a análise de completude das respostas.';
      projectUpdates.notification_is_comprehensive = false;
    }
  } else if (projectRow.status === 'draft') {
    projectUpdates.status = 'in-progress';
  }

  if (Object.keys(projectUpdates).length > 0) {
    await supabaseRequest(`projects`, {
      method: 'PATCH',
      searchParams: { id: `eq.${submission.projectId}` },
      body: projectUpdates,
      prefer: PREFER_RETURN,
    });
  }

  revalidatePath('/');
  const project = await fetchProject(submission.projectId);
  return { success: true, project };
}

export async function getSubmissions(projectId: string): Promise<Record<string, Submission>> {
  const submissionRows = await supabaseRequest<SupabaseSubmissionRow[]>(`submissions`, {
    searchParams: {
      select: 'project_id,recipient_id,answers,submitted_at',
      project_id: `eq.${projectId}`,
    },
  });

  const submissions: Record<string, Submission> = {};

  for (const row of submissionRows ?? []) {
    const key = `${row.project_id}_${row.recipient_id}`;
    submissions[key] = {
      projectId: row.project_id,
      recipientId: row.recipient_id,
      answers: Array.isArray(row.answers) ? row.answers : [],
      submittedAt: row.submitted_at,
    };
  }

  return submissions;
}
