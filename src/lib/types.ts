export interface Question {
  id: string;
  text: string;
  category: string;
}

export interface Recipient {
  id: string;
  name: string;
  position: string;
  email: string;
  questions: string[]; // Array of question IDs
  status: 'pending' | 'sent' | 'completed';
}

export interface Project {
  id: string;
  projectName: string;
  clientName: string;
  recipients: Recipient[];
  status: 'draft' | 'in-progress' | 'completed';
  notification?: {
    message: string;
    isComprehensive: boolean;
  };
}

export interface Answer {
  questionId: string;
  textAnswer?: string;
  fileAnswer?: string; // a path or URL to the uploaded file
}

export interface Submission {
  projectId: string;
  recipientId: string;
  answers: Answer[];
}
