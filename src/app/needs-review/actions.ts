
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { updateSubmission } from '@/lib/submissions';
import type { SubmissionStatus } from '@/lib/types';

const scoreSchema = z.object({
  section: z.string(),
  score: z.coerce.number(),
});

const updateSubmissionSchema = z.object({
  submissionId: z.string(),
  status: z.enum(['Assigned', 'Completed', 'Incomplete', 'Did Together']),
  scores: z.array(scoreSchema).optional(),
});

export async function handleUpdateSubmission(input: unknown) {
  const validatedInput = updateSubmissionSchema.safeParse(input);

  if (!validatedInput.success) {
    console.error('Invalid input for handleUpdateSubmission:', validatedInput.error.flatten());
    throw new Error('Invalid input');
  }

  const { submissionId, status, scores } = validatedInput.data;

  try {
    // In a real app, this would update Firestore. For now, it updates mock data.
    await updateSubmission(submissionId, { status, scores } as any);
    // Revalidate the path to show the changes
    revalidatePath('/needs-review');
    revalidatePath('/test-scores');
    revalidatePath('/');


    return { success: true, message: 'Submission updated successfully.' };
  } catch (error) {
    console.error('Error updating submission:', error);
    throw new Error('Failed to update submission.');
  }
}
