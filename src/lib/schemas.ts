import { z } from 'zod';

export const projectSchema = z.object({
  projectName: z.string().min(3, 'O nome do projeto deve ter pelo menos 3 caracteres.'),
  clientName: z.string().min(2, 'O nome do cliente deve ter pelo menos 2 caracteres.'),
  recipients: z.array(z.object({
    id: z.string(),
    name: z.string().min(2, 'O nome do destinatário é obrigatório.'),
    position: z.string().min(2, 'O cargo é obrigatório.'),
    email: z.string().email('O e-mail é inválido.'),
    questions: z.array(z.string()).optional(),
    status: z.enum(['pending', 'sent', 'completed']).optional(),
  })).min(1, 'Adicione pelo menos um destinatário.'),
});

export type ProjectFormData = z.infer<typeof projectSchema>;
