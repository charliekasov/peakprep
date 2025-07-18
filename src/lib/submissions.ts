import { db } from './firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import type { Submission, FirebaseSubmission } from './types';

const submissionsCollection = collection(db, 'submissions');

function toSubmission(doc: any): Submission {
    const data = doc.data() as FirebaseSubmission;
    return {
        id: doc.id,
        ...data,
        submittedAt: data.submittedAt.toDate(),
    };
}

export async function getSubmissions(): Promise<Submission[]> {
    const snapshot = await getDocs(submissionsCollection);
    return snapshot.docs.map(toSubmission);
}

export async function getNeedsReviewSubmissions(): Promise<Submission[]> {
    const q = query(submissionsCollection, where('status', '==', 'Needs Review'), orderBy('submittedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(toSubmission);
}