import { db, validConfig } from './firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import type { Submission, FirebaseSubmission } from './types';

const submissionsCollection = validConfig ? collection(db, 'submissions') : null;

function toSubmission(doc: any): Submission {
    const data = doc.data() as FirebaseSubmission;
    return {
        id: doc.id,
        ...data,
        submittedAt: data.submittedAt.toDate(),
    };
}

const mockSubmissions: Submission[] = [
    { id: 'sub1', assignmentId: '1', studentId: '2', status: 'Needs Review', submittedAt: new Date(Date.now() - 86400000 * 2) },
    { id: 'sub2', assignmentId: '2', studentId: '1', status: 'Needs Review', submittedAt: new Date(Date.now() - 86400000) },
    { id: 'sub3', assignmentId: '1', studentId: '3', status: 'Completed', submittedAt: new Date(Date.now() - 86400000 * 4), score: 95 },
    { id: 'sub4', assignmentId: '3', studentId: '4', status: 'In Progress', submittedAt: new Date() },
    { id: 'sub5', assignmentId: '2', studentId: '5', status: 'Needs Review', submittedAt: new Date(Date.now() - 86400000 * 3) },
];


export async function getSubmissions(): Promise<Submission[]> {
    if (!validConfig || !submissionsCollection) {
        return Promise.resolve(mockSubmissions);
    }
    const snapshot = await getDocs(submissionsCollection);
    return snapshot.docs.map(toSubmission);
}

export async function getNeedsReviewSubmissions(): Promise<Submission[]> {
    if (!validConfig || !submissionsCollection) {
        return Promise.resolve(mockSubmissions.filter(s => s.status === 'Needs Review'));
    }
    const q = query(submissionsCollection, where('status', '==', 'Needs Review'), orderBy('submittedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(toSubmission);
}
