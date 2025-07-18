'use server';

import type { Submission, FirebaseSubmission } from './types';
import { db } from './firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export async function getSubmissions(): Promise<Submission[]> {
    const submissionsCollection = collection(db, 'submissions');
    const submissionSnapshot = await getDocs(submissionsCollection);
    const submissions = submissionSnapshot.docs.map(doc => {
        const data = doc.data() as FirebaseSubmission;
        return {
            ...data,
            id: doc.id,
            submittedAt: data.submittedAt.toDate(),
        };
    });
    return submissions;
}

export async function getNeedsReviewSubmissions(): Promise<Submission[]> {
    const submissionsCollection = collection(db, 'submissions');
    const q = query(
        submissionsCollection, 
        where('status', '==', 'Needs Review')
    );
    const submissionSnapshot = await getDocs(q);
    const submissions = submissionSnapshot.docs.map(doc => {
        const data = doc.data() as FirebaseSubmission;
        return {
            ...data,
            id: doc.id,
            submittedAt: data.submittedAt.toDate(),
        };
    });
    return submissions;
}
