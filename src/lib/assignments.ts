'use client';

import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import type { Assignment } from './types';
import type { DocumentSnapshot } from 'firebase/firestore';
import { practiceTests } from './assignments-data';

// Single source of truth for Firebase assignment transformation
export function fromFirebase(doc: DocumentSnapshot): Assignment {
  const data = doc.data()!;
  return {
    ...data,
    id: doc.id,
  } as Assignment;
}

// Centralized logic for merging Firestore and hardcoded assignments
function mergeAssignments(firestoreAssignments: Assignment[]): Assignment[] {
  // Get IDs from firestore to prevent duplicates
  const firestoreIds = new Set(firestoreAssignments.map(a => a.id));
  
  // Filter hardcoded tests to exclude any that are already in firestore
  const uniquePracticeTests = practiceTests.filter(pt => !firestoreIds.has(pt.id));
  
  // Combine firestore assignments with the unique hardcoded practice tests
  return [...firestoreAssignments, ...uniquePracticeTests];
}

export async function getAssignments(): Promise<Assignment[]> {
  const assignmentsCollection = collection(db, 'assignments');
  const assignmentsSnapshot = await getDocs(assignmentsCollection);
  const firestoreAssignments = assignmentsSnapshot.docs.map(fromFirebase);
  
  return mergeAssignments(firestoreAssignments);
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