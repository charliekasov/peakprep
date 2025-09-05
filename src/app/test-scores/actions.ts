
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

const testScoreSchema = z.object({
  studentId: z.string().min(1, 'Student is required.'),
  testType: z.string().min(1, 'Test type is required.'),
  assignmentId: z.string().min(1, 'Test identifier is required.'),
  testDate: z.date({ required_error: 'Test date is required.' }),
  scores: z.array(scoreSchema),
  isOfficial: z.boolean(),
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
    // Return the ID of the existing official test assignment
    return querySnapshot.docs[0].id;
  } else {
    // Create a new official test assignment if it doesn't exist
    console.log(`Official test "${testName}" not found. Creating a new assignment entry.`);
    const newAssignment = {
      'Full Assignment Name': testName,
      'isPracticeTest': false, // Official tests are not practice tests in this context
      'isOfficialTest': true,
      'Source': 'Official',
      'Test Type': testType,
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
    const firstError = validatedInput.error.errors[0];
    console.error(
      'Invalid input for handleAddTestScore:',
      `Field: ${firstError.path.join('.')} - Message: ${firstError.message}`
    );
    throw new Error(
      `Invalid input: ${firstError.path.join('.')} - ${firstError.message}`
    );
  }

  const { studentId, testType, assignmentId, testDate, scores, isOfficial } = validatedInput.data;
  
  try {
    let finalAssignmentId = assignmentId;
    let officialTestDisplayName;

    if (isOfficial) {
      officialTestDisplayName = assignmentId; // The user-provided name
      finalAssignmentId = await findOrCreateOfficialTestAssignment(assignmentId, testType);
    }
    
    const submissionData = {
      studentId,
      assignmentId: finalAssignmentId,
      scores,
      status: 'Completed' as SubmissionStatus,
      submittedAt: testDate,
      isOfficial,
      ...(isOfficial && { officialTestName: officialTestDisplayName }),
    };

    const submissionsRef = collection(db, 'submissions');
    await addDoc(submissionsRef, submissionData);

    revalidatePath('/test-scores');
    revalidatePath('/');
    revalidatePath('/assignments');

    return { success: true, message: 'Test score added successfully.' };
  } catch (error) {
    console.error('Error adding test score:', error);
    throw new Error('Failed to add test score.');
  }
}
