
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
  scores: z.array(scoreSchema).optional(),
  isOfficial: z.boolean(),
});


async function findOrCreateOfficialTestAssignment(testName: string, testType: string) {
  if (!testName || !testType) {
    throw new Error('Test Name and Test Type are required for official tests.');
  }

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
    console.log(`Creating new official test assignment: "${testName}"`);
    const newAssignment = {
      'Full Assignment Name': testName,
      'isPracticeTest': false,
      'isOfficialTest': true,
      'Source': 'Official',
      'Test Type': testType,
      'Subject': 'Official Test',
      'Broad Category': 'Official Test',
      'Difficulty': 'Medium',
      'Link': ''
    };
    const docRef = await addDoc(assignmentsRef, newAssignment);
    return docRef.id;
  }
}

export async function handleAddTestScore(input: unknown) {
  const validatedInput = testScoreSchema.safeParse(input);

  if (!validatedInput.success) {
    const errorMessages = validatedInput.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    console.error('Invalid input for handleAddTestScore:', errorMessages);
    throw new Error(`Invalid input: ${errorMessages}`);
  }

  const { studentId, testType, assignmentId, testDate, scores, isOfficial } = validatedInput.data;
  
  try {
    let finalAssignmentId = assignmentId;
    
    if (isOfficial) {
      // For official tests, the 'assignmentId' from the form is the test name.
      finalAssignmentId = await findOrCreateOfficialTestAssignment(assignmentId, testType);
    }
    
    const submissionData = {
      studentId,
      assignmentId: finalAssignmentId,
      scores: scores || [],
      status: 'Completed' as SubmissionStatus,
      submittedAt: testDate,
      isOfficial,
      // Store the user-entered name for official tests for display purposes.
      ...(isOfficial && { officialTestName: assignmentId }),
    };

    const submissionsRef = collection(db, 'submissions');
    await addDoc(submissionsRef, submissionData);

    return { success: true, message: 'Test score added successfully.' };
  } catch (error: any) {
    console.error('Error adding test score:', error);
    throw new Error(error.message || 'Failed to add test score.');
  }
}
