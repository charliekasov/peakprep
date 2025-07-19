'use server';

import { z } from 'zod';

const assignHomeworkSchema = z.object({
  studentId: z.string(),
  assignmentIds: z.array(z.string()),
  emailSubject: z.string(),
  emailMessage: z.string(),
});

export async function handleAssignHomework(input: unknown) {
  const validatedInput = assignHomeworkSchema.safeParse(input);

  if (!validatedInput.success) {
    console.error('Invalid input for handleAssignHomework:', validatedInput.error.flatten());
    throw new Error('Invalid input');
  }

  const { studentId, assignmentIds, emailSubject, emailMessage } = validatedInput.data;

  // For now, we'll just log the details to the console.
  // In a future step, we can integrate an email service here.
  console.log('--- NEW HOMEWORK ASSIGNMENT ---');
  console.log('Student ID:', studentId);
  console.log('Assignment IDs:', assignmentIds);
  console.log('Email Subject:', emailSubject);
  console.log('Email Message:', emailMessage);
  console.log('---------------------------------');

  // Here you would typically save the assignment session to the database
  // and send the email.

  return { success: true, message: 'Homework assignment logged.' };
}
