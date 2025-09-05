
'use client';

import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import type { Submission, FirebaseSubmission, SubmissionStatus } from './types';
import type { DocumentSnapshot, Timestamp } from 'firebase/firestore';


function fromFirebase(doc: DocumentSnapshot): Submission {
  const data = doc.data() as FirebaseSubmission;
  
  const submission: Submission = {
    ...data,
    id: doc.id,
    submittedAt: (data.submittedAt as Timestamp)?.toDate() || new Date(),
    scores: data.scores || [],
    isOfficial: data.isOfficial || false,
  };

  // --- Dynamic Score Transformation ---
  // If the scores array is empty, check for top-level score fields
  // from the old import method and transform them.
  if (submission.scores.length === 0) {
    const scoreFields: { [key: string]: string } = {
        'Math Score': 'Math',
        'Reading and Writing Score': 'Reading + Writing',
        'Verbal Score': 'Verbal',
        'Quantitative Score': 'Quantitative',
        'Reading Score': 'Reading'
    };

    for (const [sheetHeader, sectionName] of Object.entries(scoreFields)) {
        if ((data as any)[sheetHeader]) {
            const scoreValue = Number((data as any)[sheetHeader]);
            if (!isNaN(scoreValue)) {
                submission.scores.push({ section: sectionName, score: scoreValue });
            }
        }
    }
  }
  // --- End Transformation ---
  
  return submission;
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
