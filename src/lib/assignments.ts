'use client';

import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import type { Assignment } from './types';
import type { DocumentSnapshot } from 'firebase/firestore';

function fromFirebase(doc: DocumentSnapshot): Assignment {
  const data = doc.data()!;
  return {
    ...data,
    id: doc.id,
  } as Assignment;
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

    