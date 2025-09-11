'use server';

/**
 * @fileOverview A flow to notify the form owner when all recipients have completed their submissions,
 *  including an assessment of the responses' comprehensiveness.
 *
 * - formCompletionNotification - A function that triggers the notification process.
 * - FormCompletionNotificationInput - The input type for the formCompletionNotification function.
 * - FormCompletionNotificationOutput - The return type for the formCompletionNotification function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FormCompletionNotificationInputSchema = z.object({
  projectName: z.string().describe('The name of the project.'),
  clientName: z.string().describe('The name of the client.'),
  recipientEmails: z.array(z.string()).describe('A list of recipient email addresses.'),
  responses: z.record(z.string(), z.any()).describe('A map of recipient email to their responses.'),
});
export type FormCompletionNotificationInput = z.infer<
  typeof FormCompletionNotificationInputSchema
>;

const FormCompletionNotificationOutputSchema = z.object({
  notificationMessage: z.string().describe('The notification message to be sent to the form owner.'),
  isComprehensive: z.boolean().describe('Whether the responses appear comprehensive.'),
});
export type FormCompletionNotificationOutput = z.infer<
  typeof FormCompletionNotificationOutputSchema
>;

export async function formCompletionNotification(
  input: FormCompletionNotificationInput
): Promise<FormCompletionNotificationOutput> {
  return formCompletionNotificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'formCompletionNotificationPrompt',
  input: {schema: FormCompletionNotificationInputSchema},
  output: {schema: FormCompletionNotificationOutputSchema},
  prompt: `All recipients have submitted their forms for project "{{projectName}}" for client "{{clientName}}".\n\nRecipient Emails: {{recipientEmails}}\nResponses: {{responses}}\n\nGenerate a notification message to inform the form owner that all submissions are complete and assess whether the responses appear comprehensive, highlighting any potential missing information or inconsistencies.`,
});

const formCompletionNotificationFlow = ai.defineFlow(
  {
    name: 'formCompletionNotificationFlow',
    inputSchema: FormCompletionNotificationInputSchema,
    outputSchema: FormCompletionNotificationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
