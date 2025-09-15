export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue | undefined };

export type JsonObject = { [key: string]: JsonValue | undefined };

export type JsonArray = JsonValue[];

export type RecipientStatus = 'pendente' | 'enviado' | 'concluido';

export type ProjectStatus = 'rascunho' | 'em_andamento' | 'concluido';

export interface Recipient {
  id: string;
  name: string;
  position: string;
  email: string;
  questions: JsonArray;
  status: RecipientStatus;
}

export interface Project {
  id: string;
  projectName: string;
  clientName: string;
  recipients: Recipient[];
  status: ProjectStatus;
  notification?: {
    message: string;
    isComprehensive: boolean;
  };
}

export interface Submission {
  projectId: string;
  recipientId: string;
  answers: JsonArray;
}
