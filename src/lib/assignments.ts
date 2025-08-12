'use server';

import { dbAdmin } from './firebase-admin';
import type { Assignment, FirebaseAssignment } from './types';
import { Timestamp } from 'firebase-admin/firestore';


function fromFirebase(doc: admin.firestore.DocumentSnapshot): Assignment {
  const data = doc.data() as FirebaseAssignment;
  return {
    ...data,
    id: doc.id,
    dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : undefined,
  };
}


export async function getAssignments(): Promise<Assignment[]> {
    const assignmentsCollection = dbAdmin.collection('assignments');
    const assignmentsSnapshot = await assignmentsCollection.get();
    const assignments = assignmentsSnapshot.docs.map(fromFirebase);
    return assignments;
}

export async function getAssignmentById(id: string): Promise<Assignment | null> {
    const docRef = dbAdmin.collection('assignments').doc(id);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
        return fromFirebase(docSnap);
    } else {
        return null;
    }
}


export async function getAssignmentsCount(): Promise<number> {
    const assignmentsCollection = dbAdmin.collection('assignments');
    const assignmentsSnapshot = await assignmentsCollection.get();
    return assignmentsSnapshot.size;
}
