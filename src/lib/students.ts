'use client';

import { collection, getDocs, getDoc, doc, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Student } from './types';

export async function getStudents(): Promise<Student[]> {
  const studentsCollection = collection(db, 'students');
  const studentsSnapshot = await getDocs(studentsCollection);
  const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
  return students;
}

export async function getStudentById(id: string): Promise<Student | null> {
  const docRef = doc(db, 'students', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Student;
  }
  return null;
}

export async function getStudentsCount(): Promise<number> {
  const studentsCollection = collection(db, 'students');
  const studentsSnapshot = await getDocs(studentsCollection);
  return studentsSnapshot.size;
}

export async function addStudent(student: Omit<Student, 'id'>): Promise<string> {
  const studentsCollection = collection(db, 'students');
  const docRef = await addDoc(studentsCollection, student);
  return docRef.id;
}
