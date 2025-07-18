'use server';

import type { Student } from './types';
import { db } from './firebase';
import { addDoc, collection, getDocs } from 'firebase/firestore';

export async function getStudents(): Promise<Student[]> {
  const studentsCollection = collection(db, 'students');
  const studentSnapshot = await getDocs(studentsCollection);
  const students = studentSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Student, 'id'>),
  }));
  return students;
}

export async function getStudentById(id: string): Promise<Student | null> {
  // This function would need to be implemented to fetch a single student
  // from Firestore, but for now we'll leave it as is.
  return null;
}

export async function getStudentsCount(): Promise<number> {
  const studentsCollection = collection(db, 'students');
  const studentSnapshot = await getDocs(studentsCollection);
  return studentSnapshot.size;
}

export async function addStudent(student: Omit<Student, 'id'>): Promise<string> {
    const studentsCollection = collection(db, 'students');
    const docRef = await addDoc(studentsCollection, student);
    return docRef.id;
}
