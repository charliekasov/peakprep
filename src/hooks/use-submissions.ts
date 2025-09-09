
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Submission, FirebaseSubmission } from '@/lib/types';
import type { DocumentSnapshot } from 'firebase/firestore';
import { useAuth } from './use-auth';

function fromFirebase(doc: DocumentSnapshot): Submission {
  const data = doc.data() as FirebaseSubmission;
  
  const submission: Submission = {
    ...data,
    id: doc.id,
    submittedAt: (data.submittedAt as Timestamp)?.toDate() || new Date(),
    scores: data.scores || [],
    isOfficial: data.isOfficial || false,
    officialTestName: data.officialTestName
  };

  if (!submission.scores || submission.scores.length === 0) {
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
              if (!submission.scores) {
                submission.scores = [];
            }
            submission.scores.push({ section: sectionName, score: scoreValue });
            }
        }
    }
  }
  
  return submission;
}

export function useSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
        setSubmissions([]);
        setLoading(false);
        return;
    }
    
    setLoading(true);
    const submissionsCollection = collection(db, 'submissions');
    
    const unsubscribe = onSnapshot(submissionsCollection, (snapshot) => {
      const submissionData = snapshot.docs.map(fromFirebase)
        .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
      setSubmissions(submissionData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching submissions in real-time: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { submissions, loading };
}
