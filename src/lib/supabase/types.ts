import type { Answer } from '@/lib/types';

export interface SupabaseProjectRow {
  id: string;
  project_name: string;
  client_name: string;
  status: 'draft' | 'in-progress' | 'completed';
  notification_message: string | null;
  notification_is_comprehensive: boolean | null;
  created_at: string;
  updated_at: string | null;
}

export interface SupabaseRecipientRow {
  id: string;
  project_id: string;
  name: string;
  position: string;
  email: string;
  questions: string[] | null;
  status: 'pending' | 'sent' | 'completed';
  created_at: string;
  updated_at: string | null;
}

export interface SupabaseSubmissionRow {
  id: string;
  project_id: string;
  recipient_id: string;
  answers: Answer[] | null;
  submitted_at: string;
}
