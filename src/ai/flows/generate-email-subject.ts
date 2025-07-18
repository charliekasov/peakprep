'use server';

/**
 * @fileOverview A flow to generate engaging and relevant subject lines for assignment emails based on assignment content and student profile.
 *
 * - generateEmailSubject - A function that generates email subjects.
 * - GenerateEmailSubjectInput - The input type for the generateEmailSubject function.
 * - GenerateEmailSubjectOutput - The return type for the generateEmailSubject function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEmailSubjectInputSchema = z.object({
  assignmentContent: z
    .string()
    .describe('The content of the assignment, including instructions and topics covered.'),
  studentProfile: z
    .string()
    .describe('The student profile, including their interests, past performance, and learning style.'),
  completionRate: z
    .number()
    .optional()
    .describe('The completion rate for similar assignments, if known.'),
});
export type GenerateEmailSubjectInput = z.infer<typeof GenerateEmailSubjectInputSchema>;

const GenerateEmailSubjectOutputSchema = z.object({
  subjectLine: z.string().describe('The generated subject line for the assignment email.'),
  suggestedDifficulty: z
    .string()
    .optional()
    .describe('Suggested difficulty level based on completion rates.'),
});
export type GenerateEmailSubjectOutput = z.infer<typeof GenerateEmailSubjectOutputSchema>;

export async function generateEmailSubject(input: GenerateEmailSubjectInput): Promise<GenerateEmailSubjectOutput> {
  return generateEmailSubjectFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEmailSubjectPrompt',
  input: {schema: GenerateEmailSubjectInputSchema},
  output: {schema: GenerateEmailSubjectOutputSchema},
  prompt: `You are an AI assistant helping a tutor generate engaging subject lines for assignment emails.

  Based on the assignment content and student profile, create a subject line that will increase student engagement and open rates.

  Assignment Content: {{{assignmentContent}}}
  Student Profile: {{{studentProfile}}}
  Completion Rate: {{{completionRate}}}

  Consider the student's interests, past performance, and learning style when crafting the subject line.
  Also, suggest a difficulty level (Easy, Medium, Hard) for the assignment based on the completion rate of similar assignments. If completion rate is above 80%, suggest Easy. If between 50% and 80%, suggest Medium. If below 50%, suggest Hard. Output the subject line, and suggested difficulty (if completion rate is known).`,
});

const generateEmailSubjectFlow = ai.defineFlow(
  {
    name: 'generateEmailSubjectFlow',
    inputSchema: GenerateEmailSubjectInputSchema,
    outputSchema: GenerateEmailSubjectOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
