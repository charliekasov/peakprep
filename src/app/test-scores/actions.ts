
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
  // assignmentId can be the ID of a practice test OR the name of an official test
  assignmentId: z.string().min(1, 'Test identifier is required.'),
  testDate: z.date({ required_error: 'Test date is required.' }),
  scores: z.array(scoreSchema),
});

async function findOrCreateOfficialTestAssignment(testName: string, testType: string) {
  const assignmentsRef = collection(db, 'assignments');
  const q = query(
    assignmentsRef,
    where('Full Assignment Name', '==', testName),
    where('isOfficialTest', '==', true)
  );

  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].id;
  } else {
    // Create it if it doesn't exist
    const newAssignment = {
      'Full Assignment Name': testName,
      'isPracticeTest': true, // Treat like a practice test for scoring purposes
      'isOfficialTest': true,
      'Source': 'Official',
      'Test Type': testType.replace('Official ', ''),
      'Subject': 'Official Test',
    };
    const docRef = await addDoc(assignmentsRef, newAssignment);
    console.log(`Created new official test assignment: ${docRef.id}`);
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

    // If testType starts with 'Official', it's an official test.
    if (testType.startsWith('Official')) {
        isOfficial = true;
        // The assignmentId here is actually the name, like "May 2024 Digital SAT"
        finalAssignmentId = await findOrCreateOfficialTestAssignment(assignmentId, testType);
    }
    

    const submissionsRef = collection(db, 'submissions');
    const submissionData = {
      studentId,
      assignmentId: finalAssignmentId,
      scores,
      status: 'Completed' as SubmissionStatus,
      submittedAt: testDate,
      isOfficial,
    };

    if (isOfficial) {
       // When saving an official test, we store the user-provided name
       // in the assignmentId field for display purposes, but link it
       // to the actual (potentially new) assignment document via finalAssignmentId.
       // The UI will then know to display assignmentId if isOfficial is true.
       submissionData.assignmentId = assignmentId; // The user-provided name
       // We should actually save the real ID to a different field, or adjust our model.
       // For now, let's adjust the submission logic:
       const officialTestDocId = await findOrCreateOfficialTestAssignment(assignmentId, testType);
       submissionData.assignmentId = officialTestDocId;
    }


    await addDoc(submissionsRef, submissionData);

    revalidatePath('/test-scores');
    revalidatePath('/'); // Revalidate dashboard as well

    return { success: true, message: 'Test score added successfully.' };
  } catch (error) {
    console.error('Error adding test score:', error);
    throw new Error('Failed to add test score.');
  }
}

    