import { supabaseServer } from "./server";
import type { Project, ProjectStatus, Recipient, RecipientStatus } from "@/types";
import type { JsonArray } from "@/types";

export interface RecipientRow {
  id: string;
  project_id: string;
  name: string;
  position: string;
  email: string;
  status: RecipientStatus | null;
  questions: unknown;
}

interface ProjectRow {
  id: string;
  project_name: string;
  client_name: string;
  status: ProjectStatus | null;
  notification: unknown;
  recipients?: RecipientRow[] | null;
}

export interface SubmissionRow {
  id: string;
  project_id: string;
  recipient_id: string;
  answers: unknown;
}

export const sanitizeQuestions = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const uniqueValues = new Set<string>();
  for (const item of value) {
    if (typeof item === "string") {
      uniqueValues.add(item);
    }
  }

  return Array.from(uniqueValues);
};

const parseNotification = (value: unknown): Project["notification"] => {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const message = typeof record.message === "string" ? record.message : undefined;
  const isComprehensive = typeof record.isComprehensive === "boolean" ? record.isComprehensive : false;

  if (!message) {
    return undefined;
  }

  return {
    message,
    isComprehensive,
  };
};

export const mapRecipientRow = (row: RecipientRow): Recipient => ({
  id: row.id,
  name: row.name,
  position: row.position,
  email: row.email,
  status: (row.status ?? "pendente") as RecipientStatus,
  questions: sanitizeQuestions(row.questions) as JsonArray,
});

export const mapProjectRow = (row: ProjectRow): Project => ({
  id: row.id,
  projectName: row.project_name,
  clientName: row.client_name,
  status: (row.status ?? "rascunho") as ProjectStatus,
  recipients: (row.recipients ?? []).map(mapRecipientRow),
  notification: parseNotification(row.notification),
});

export async function fetchProjectWithRecipients(projectId: string): Promise<Project | null> {
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("projects")
    .select(
      `id, project_name, client_name, status, notification, recipients (id, project_id, name, position, email, status, questions)`
    )
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch project: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapProjectRow(data as ProjectRow);
}

export async function fetchRecipientsByProjectId(projectId: string): Promise<RecipientRow[]> {
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("recipients")
    .select("id, project_id, name, position, email, status, questions")
    .eq("project_id", projectId);

  if (error) {
    throw new Error(`Failed to fetch recipients: ${error.message}`);
  }

  return (data as RecipientRow[]) ?? [];
}

export async function fetchRecipientById(projectId: string, recipientId: string): Promise<RecipientRow | null> {
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("recipients")
    .select("id, project_id, name, position, email, status, questions")
    .eq("project_id", projectId)
    .eq("id", recipientId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch recipient: ${error.message}`);
  }

  return (data as RecipientRow) ?? null;
}

export async function fetchSubmissionsByProjectId(projectId: string): Promise<SubmissionRow[]> {
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("submissions")
    .select("id, project_id, recipient_id, answers")
    .eq("project_id", projectId);

  if (error) {
    throw new Error(`Failed to fetch submissions: ${error.message}`);
  }

  return (data as SubmissionRow[]) ?? [];
}
