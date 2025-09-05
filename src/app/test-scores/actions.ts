
'use server';

import { addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import type { SubmissionStatus } from '@/lib/types';

const scoreSchema = z.object({
  section: z.string(),
  score: z.coerce.number(),
});

// This schema now handles both official tests and existing practice tests
const testScoreSchema = z.object({
  studentId: z.string().min(1, 'Student is required.'),
  testType: z.string().min(1, 'Test type is required.'),
  // assignmentId is optional, only used for practice tests
  assignmentId: z.string().optional(),
  testDate: z.date({ required_error: 'Test date is required.' }),
  scores: z.array(scoreSchema),
});

async function findOrCreateOfficialTestAssignment(testType: string) {
  const assignmentsRef = collection(db, 'assignments');
  const q = query(
    assignmentsRef,
    where('Full Assignment Name', '==', testType),
    where('isOfficialTest', '==', true)
  );

  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].id;
  } else {
    // Create it if it doesn't exist
    const newAssignment = {
      'Full Assignment Name': testType,
      isPracticeTest: true, // Treat like a practice test for scoring purposes
      isOfficialTest: true,
      Source: 'Official',
      'Test Type': testType.replace('Official ', ''),
      Subject: 'Official Test',
    };
    const docRef = await addDoc(assignmentsRef, newAssignment);
    return docRef.id;
  }
}

export async function handleAddTestScore(input: unknown) {
  const validatedInput = testScoreSchema.safeParse(input);

  if (!validatedInput.success) {
    console.error(
      'Invalid input for handleAddTestScore:',
      validatedInput.error.flatten()
    );
    const firstError = validatedInput.error.errors[0];
    throw new Error(
      `Invalid input: ${firstError.path.join('.')} - ${firstError.message}`
    );
  }

  const { studentId, testType, assignmentId, testDate, scores } =
    validatedInput.data;

  try {
    let finalAssignmentId = assignmentId;
    let isOfficial = false;

    // If no assignmentId is provided, it's an official test.
    if (!finalAssignmentId) {
      finalAssignmentId = await findOrCreateOfficialTestAssignment(testType);
      isOfficial = true;
    }

    const submissionsRef = collection(db, 'submissions');
    await addDoc(submissionsRef, {
      studentId,
      assignmentId: finalAssignmentId,
      scores,
      status: 'Completed' as SubmissionStatus,
      submittedAt: testDate, // Use the provided date as the submission date
      isOfficial,
    });

    revalidatePath('/test-scores');
    revalidatePath('/'); // Revalidate dashboard as well

    return { success: true, message: 'Test score added successfully.' };
  } catch (error) {
    console.error('Error adding test score:', error);
    throw new Error('Failed to add test score.');
  }
}
