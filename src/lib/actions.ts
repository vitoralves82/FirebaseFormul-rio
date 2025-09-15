'use server';

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { formCompletionNotification } from '@/ai/flows/form-completion-notification';
import type { Project, Submission } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { projectSchema, type ProjectFormData } from '@/lib/schemas';
import { QUESTIONS } from '@/lib/questions';

// In a real app, this would be replaced with Firebase, a SQL DB, etc.
// This mock DB persists data across server action calls within the same server instance.
const MOCK_DB: { projects: Project[]; submissions: Record<string, Submission> } = {
  projects: [],
  submissions: {},
};

export async function createOrUpdateProject(data: ProjectFormData, existingProjectId?: string) {
  const validatedData = projectSchema.parse(data);
  const allQuestionIds = QUESTIONS.map(q => q.id);

  if (existingProjectId) {
    const projectIndex = MOCK_DB.projects.findIndex(p => p.id === existingProjectId);
    if (projectIndex === -1) throw new Error('Project not found');

    const existingProject = MOCK_DB.projects[projectIndex];
    MOCK_DB.projects[projectIndex] = {
      ...existingProject,
      ...validatedData,
      recipients: validatedData.recipients.map(newRecipient => {
        const existingRecipient = existingProject.recipients.find(r => r.id === newRecipient.id);
        return existingRecipient ? { ...existingRecipient, ...newRecipient } : { ...newRecipient, questions: allQuestionIds, status: 'pending' };
      }),
    };
    revalidatePath('/');
    return MOCK_DB.projects[projectIndex];
  } else {
    const newProject: Project = {
      id: uuidv4(),
      ...validatedData,
      recipients: validatedData.recipients.map(r => ({ ...r, questions: allQuestionIds, status: 'pending' })),
      status: 'draft',
    };
    MOCK_DB.projects.push(newProject);
    revalidatePath('/');
    return newProject;
  }
}

export async function updateProjectQuestions(projectId: string, recipientId: string, questions: string[]) {
  const project = MOCK_DB.projects.find(p => p.id === projectId);
  if (!project) throw new Error('Project not found');

  const recipient = project.recipients.find(r => r.id === recipientId);
  if (!recipient) throw new Error('Recipient not found');

  recipient.questions = questions;

  revalidatePath('/');
  return project;
}

export async function markSingleEmailAsSent(projectId: string, recipientId: string) {
    const project = MOCK_DB.projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found');

    const recipient = project.recipients.find(r => r.id === recipientId);
    if (!recipient) throw new Error('Recipient not found');

    if (recipient.questions.length > 0) {
        recipient.status = 'sent';
    }

    const hasSentEmails = project.recipients.some(r => r.status === 'sent' || r.status === 'completed');
    if (hasSentEmails && project.status === 'draft') {
        project.status = 'in-progress';
    }
    
    revalidatePath('/');
    return project;
}


export async function submitResponse(submission: Submission) {
  const project = MOCK_DB.projects.find(p => p.id === submission.projectId);
  if (!project) throw new Error('Project not found');

  const submissionKey = `${submission.projectId}_${submission.recipientId}`;
  MOCK_DB.submissions[submissionKey] = submission;

  const recipient = project.recipients.find(r => r.id === submission.recipientId);
  if (recipient) {
    recipient.status = 'completed';
  }

  const allCompleted = project.recipients.every(r => r.status === 'completed' || r.questions.length === 0);

  if (allCompleted) {
    project.status = 'completed';
    const recipientEmails = project.recipients.map(r => r.email);
    const responses = recipientEmails.reduce((acc, email) => {
        const recip = project.recipients.find(r => r.email === email);
        const sub = recip ? MOCK_DB.submissions[`${project.id}_${recip.id}`] : undefined;
        acc[email] = sub?.answers.reduce((ansAcc, ans) => {
            ansAcc[ans.questionId] = ans.textAnswer || ans.fileAnswer || 'Não respondido';
            return ansAcc;
        }, {} as Record<string, any>) || 'Nenhuma submissão';
        return acc;
    }, {} as Record<string, any>);

    try {
      const notification = await formCompletionNotification({
        projectName: project.projectName,
        clientName: project.clientName,
        recipientEmails: recipientEmails,
        responses: responses,
      });

      project.notification = {
        message: notification.notificationMessage,
        isComprehensive: notification.isComprehensive,
      };

    } catch (error) {
      console.error('Error generating AI notification:', error);
      project.notification = {
        message: 'Falha ao gerar a análise de completude das respostas.',
        isComprehensive: false,
      };
    }
  }

  revalidatePath('/');
  return { success: true, project };
}

export async function getSubmissions(projectId: string): Promise<Record<string, Submission>> {
  const projectSubmissions: Record<string, Submission> = {};
  for (const key in MOCK_DB.submissions) {
    if (key.startsWith(`${projectId}_`)) {
      projectSubmissions[key] = MOCK_DB.submissions[key];
    }
  }
  return projectSubmissions;
}
