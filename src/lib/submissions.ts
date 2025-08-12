
'use server';

import { dbAdmin } from './firebase-admin';
import type { Submission, FirebaseSubmission, SubmissionStatus } from './types';
import { Timestamp } from 'firebase-admin/firestore';


function fromFirebase(doc: admin.firestore.DocumentSnapshot): Submission {
  const data = doc.data() as FirebaseSubmission;
  return {
    ...data,
    id: doc.id,
    submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt.toDate() : new Date(),
  };
}

export async function getSubmissions(): Promise<Submission[]> {
    const submissionsCollection = dbAdmin.collection('submissions');
    const submissionsSnapshot = await submissionsCollection.get();
    const submissions = submissionsSnapshot.docs.map(fromFirebase);
    return submissions.sort((a,b) => b.submittedAt.getTime() - a.submittedAt.getTime());
}

export async function getNeedsReviewSubmissions(): Promise<Submission[]> {
    const submissionsCollection = dbAdmin.collection('submissions');
    const q = submissionsCollection.where('status', 'in', ['Assigned', 'Incomplete']);
    const querySnapshot = await q.get();
    
    const needsReview = querySnapshot.docs.map(fromFirebase);

    return needsReview.sort((a,b) => a.submittedAt.getTime() - b.submittedAt.getTime());
}

export async function updateSubmission(submissionId: string, updates: Partial<{ status: SubmissionStatus; scores: { section: string; score: number }[] }>) {
  const submissionRef = dbAdmin.collection('submissions').doc(submissionId);
  
  await submissionRef.update(updates);

  console.log('Updated Submission:', submissionId, updates);
  
  return Promise.resolve();
}
