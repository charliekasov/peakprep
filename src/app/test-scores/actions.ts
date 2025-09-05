
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
    
    // For official tests, we want to display the user-provided name (e.g. "May 2024 SAT")
    // instead of the auto-generated assignment ID. We'll store the real ID in a separate
    // field to maintain the relation, but use the friendly name for display.
    // Let's adjust the data model slightly.
    if (isOfficial) {
       // `assignmentId` holds the real doc ID, `officialTestName` holds the display name.
       submissionData.assignmentId = finalAssignmentId;
       (submissionData as any).officialTestName = assignmentId;
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

    