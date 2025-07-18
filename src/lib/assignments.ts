import { db } from './firebase';
import { collection, getDocs, query, where, getCountFromServer, doc, getDoc, Timestamp } from 'firebase/firestore';
import type { Assignment, FirebaseAssignment } from './types';

const assignmentsCollection = collection(db, 'assignments');

function toAssignment(doc: any): Assignment {
    const data = doc.data() as FirebaseAssignment;
    return {
        id: doc.id,
        ...data,
        dueDate: data.dueDate.toDate(),
    };
}

export async function getAssignments(): Promise<Assignment[]> {
    const snapshot = await getDocs(assignmentsCollection);
    return snapshot.docs.map(toAssignment);
}

export async function getAssignmentById(id: string): Promise<Assignment | null> {
    const docRef = doc(db, 'assignments', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return toAssignment(docSnap);
    } else {
        return null;
    }
}


export async function getAssignmentsCount(): Promise<number> {
    const snapshot = await getCountFromServer(assignmentsCollection);
    return snapshot.data().count;
}