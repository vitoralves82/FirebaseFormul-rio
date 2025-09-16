import type { JsonObject } from '@/types';

export interface Question {
  id: string;
  text: string;
  category: string;
}

export interface Answer extends JsonObject {
  questionId: string;
  textAnswer?: string | null;
  fileAnswer?: string | null; // a path ou URL para o arquivo enviado
}
