import { db, validConfig } from './firebase';
import { collection, getDocs, query, where, getCountFromServer, doc, getDoc, Timestamp } from 'firebase/firestore';
import type { Assignment, FirebaseAssignment } from './types';
import { chartData } from './mock-data'; // Assuming mock assignments can be derived or added here

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
    { id: '1', title: 'Algebra I Homework', subject: 'Math', content: 'Complete exercises 1-10.', dueDate: new Date() },
    { id: '2', title: 'The Great Gatsby Essay', subject: 'English', content: 'Write a 500-word essay.', dueDate: new Date() },
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
