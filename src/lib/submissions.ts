'use client';

import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import type { Submission, FirebaseSubmission, SubmissionStatus } from './types';
import type { DocumentSnapshot, Timestamp } from 'firebase/firestore';


function fromFirebase(doc: DocumentSnapshot): Submission {
  const data = doc.data() as FirebaseSubmission;
  return {
    ...data,
    id: doc.id,
    submittedAt: (data.submittedAt as Timestamp)?.toDate() || new Date(),
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
  
  return Promise.resolve();
}
