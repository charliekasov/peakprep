'use server';

import { z } from 'zod';
import { generateEmailSubject, GenerateEmailSubjectInput, GenerateEmailSubjectOutput } from '@/ai/flows/generate-email-subject';

const assignmentDetailsSchema = z.object({
  id: z.string(),
  sections: z.array(z.string()).optional(),
  timing: z.enum(['timed', 'untimed']).optional(),
});

const assignHomeworkSchema = z.object({
  studentId: z.string(),
  assignments: z.array(assignmentDetailsSchema),
  emailSubject: z.string(),
  emailMessage: z.string(),
});

export async function handleAssignHomework(input: unknown) {
  const validatedInput = assignHomeworkSchema.safeParse(input);

  if (!validatedInput.success) {
    console.error('Invalid input for handleAssignHomework:', validatedInput.error.flatten());
    throw new Error('Invalid input');
  }

  const { studentId, assignments, emailSubject, emailMessage } = validatedInput.data;

  // For now, we'll just log the details to the console.
  // In a future step, we can integrate an email service here.
  console.log('--- NEW HOMEWORK ASSIGNMENT ---');
  console.log('Student ID:', studentId);
  console.log('Assignments:', JSON.stringify(assignments, null, 2));
  console.log('Email Subject:', emailSubject);
  console.log('Email Message:', emailMessage);
  console.log('---------------------------------');

  // Here you would typically save the assignment session to the database
  // and send the email.

  return { success: true, message: 'Homework assignment logged.' };
}

export async function handleGenerateSubjectForAssignment(
  input: GenerateEmailSubjectInput
): Promise<GenerateEmailSubjectOutput> {
  const result = await generateEmailSubject(input);
  return result;
}