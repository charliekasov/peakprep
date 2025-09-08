
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import type { Assignment } from './types';
import type { DocumentSnapshot } from 'firebase/firestore';
import { practiceTests } from './assignments-data';

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
    const firestoreAssignments = assignmentsSnapshot.docs.map(fromFirebase);

    // Combine firestore assignments with hardcoded practice tests
    const allAssignments = [...firestoreAssignments, ...practiceTests];
    
    return allAssignments;
}

export async function getAssignmentById(id: string): Promise<Assignment | null> {
    // First, check hardcoded data
    const practiceTest = practiceTests.find(p => p.id === id);
    if (practiceTest) {
      return practiceTest;
    }

    // If not found, check Firestore
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
    return assignmentsSnapshot.size + practiceTests.length;
}
