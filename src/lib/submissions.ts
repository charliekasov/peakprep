
'use server';

import { db } from './firebase';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import type { Submission, FirebaseSubmission, SubmissionStatus } from './types';
import { getAssignments } from './assignments';

function fromFirebase(doc: any): Submission {
  const data = doc.data() as FirebaseSubmission;
  return {
    ...data,
    id: doc.id,
    submittedAt: data.submittedAt.toDate(),
  };
}

export async function getSubmissions(): Promise<Submission[]> {
    const submissionsCollection = collection(db, 'submissions');
    const submissionsSnapshot = await getDocs(submissionsCollection);
    const submissions = submissionsSnapshot.docs.map(fromFirebase);
    return submissions.sort((a,b) => b.submittedAt.getTime() - a.submittedAt.getTime());
}

export async function getNeedsReviewSubmissions(): Promise<Submission[]> {
    const submissionsCollection = collection(db, 'submissions');
    const q = query(submissionsCollection, where('status', 'in', ['Assigned', 'Incomplete']));
    const querySnapshot = await getDocs(q);
    
    const needsReview = querySnapshot.docs.map(fromFirebase);

    return needsReview.sort((a,b) => a.submittedAt.getTime() - b.submittedAt.getTime());
}

export async function updateSubmission(submissionId: string, updates: Partial<{ status: SubmissionStatus; scores: { section: string; score: number }[] }>) {
  const submissionRef = doc(db, 'submissions', submissionId);
  
  await updateDoc(submissionRef, updates);

  console.log('Updated Submission:', submissionId, updates);
  
  // No need to return the submission, the calling function will revalidate the path
  return Promise.resolve();
}
