'use server';

import { db } from './firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import type { Assignment, FirebaseAssignment } from './types';

function fromFirebase(doc: any): Assignment {
  const data = doc.data() as FirebaseAssignment;
  return {
    ...data,
    id: doc.id,
    dueDate: data.dueDate?.toDate(),
  };
}


export async function getAssignments(): Promise<Assignment[]> {
    const assignmentsCollection = collection(db, 'assignments');
    const assignmentsSnapshot = await getDocs(assignmentsCollection);
    const assignments = assignmentsSnapshot.docs.map(fromFirebase);
    return assignments;
}

export async function getAssignmentById(id: string): Promise<Assignment | null> {
    const docRef = doc(db, 'assignments', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return fromFirebase(docSnap);
    } else {
        return null;
    }
}


export async function getAssignmentsCount(): Promise<number> {
    const assignmentsCollection = collection(db, 'assignments');
    const assignmentsSnapshot = await getDocs(assignmentsCollection);
    return assignmentsSnapshot.size;
}
