'use server';

import { generateEmailSubject, GenerateEmailSubjectInput, GenerateEmailSubjectOutput } from '@/ai/flows/generate-email-subject';
import { z } from 'zod';

const formSchema = z.object({
  studentProfile: z.string(),
  assignmentContent: z.string(),
  completionRate: z.number().optional(),
});

export async function handleGenerateSubject(
  input: z.infer<typeof formSchema>
): Promise<GenerateEmailSubjectOutput> {
  const validatedInput = formSchema.safeParse(input);

  if (!validatedInput.success) {
    throw new Error('Invalid input');
  }

  const result = await generateEmailSubject(validatedInput.data);
  return result;
}
