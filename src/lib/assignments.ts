import { db, validConfig } from './firebase';
import { collection, getDocs, query, where, getCountFromServer, doc, getDoc, Timestamp } from 'firebase/firestore';
import type { Assignment, FirebaseAssignment } from './types';
import { chartData } from './mock-data';

const assignmentsCollection = validConfig ? collection(db, 'assignments') : null;

function toAssignment(doc: any): Assignment {
    const data = doc.data() as FirebaseAssignment;
    return {
        id: doc.id,
        ...data,
        dueDate: data.dueDate.toDate(),
    };
}

const mockAssignments: Assignment[] = [
    { id: '1', title: 'Algebra I: Chapter 5 Homework', subject: 'Math', content: 'Complete exercises 1-20 on page 150. Show all your work.', dueDate: new Date(Date.now() + 86400000 * 5) },
    { id: '2', title: 'The Great Gatsby: Symbolism Essay', subject: 'English', content: 'Write a 500-word essay on the use of symbolism for the theme of the American Dream in The Great Gatsby.', dueDate: new Date(Date.now() + 86400000 * 7) },
    { id: '3', title: 'Cellular Respiration Lab Report', subject: 'Science', content: 'Write a full lab report on our experiment with yeast and sugar. Include a hypothesis, materials, method, results, and conclusion.', dueDate: new Date(Date.now() + 86400000 * 10) },
    { id: '4', title: 'World War II: Causes and Effects', subject: 'History', content: 'Create a presentation outlining the primary causes and long-term effects of World War II.', dueDate: new Date(Date.now() + 86400000 * 14) },
];


export async function getAssignments(): Promise<Assignment[]> {
    if (!validConfig || !assignmentsCollection) {
        return Promise.resolve(mockAssignments);
    }
    const snapshot = await getDocs(assignmentsCollection);
    return snapshot.docs.map(toAssignment);
}

export async function getAssignmentById(id: string): Promise<Assignment | null> {
    if (!validConfig || !assignmentsCollection) {
        return Promise.resolve(mockAssignments.find(a => a.id === id) || null);
    }
    const docRef = doc(db, 'assignments', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return toAssignment(docSnap);
    } else {
        return null;
    }
}


export async function getAssignmentsCount(): Promise<number> {
    if (!validConfig || !assignmentsCollection) {
        return Promise.resolve(mockAssignments.length);
    }
    const snapshot = await getCountFromServer(assignmentsCollection);
    return snapshot.data().count;
}
