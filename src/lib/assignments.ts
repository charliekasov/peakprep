'use server';

import type { Assignment, FirebaseAssignment } from './types';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function getAssignments(): Promise<Assignment[]> {
    const assignmentsCollection = collection(db, 'assignments');
    const assignmentSnapshot = await getDocs(assignmentsCollection);
    const assignments = assignmentSnapshot.docs.map(doc => {
        const data = doc.data() as FirebaseAssignment;
        return {
            ...data,
            id: doc.id,
            dueDate: data.dueDate?.toDate(),
        };
    });
    return assignments;
}

export async function getAssignmentById(id: string): Promise<Assignment | null> {
    // This function would need to be implemented to fetch a single assignment
    // from Firestore.
    return null;
}


export async function getAssignmentsCount(): Promise<number> {
    const assignmentsCollection = collection(db, 'assignments');
    const assignmentSnapshot = await getDocs(assignmentsCollection);
    return assignmentSnapshot.size;
}
