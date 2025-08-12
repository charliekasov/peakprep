'use server';

import { dbAdmin } from './firebase-admin';
import type { Student } from './types';


export async function getStudents(): Promise<Student[]> {
  const studentsCollection = dbAdmin.collection('students');
  const studentsSnapshot = await studentsCollection.get();
  const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
  return students;
}

export async function getStudentById(id: string): Promise<Student | null> {
  const docRef = dbAdmin.collection('students').doc(id);
  const docSnap = await docRef.get();
  if (docSnap.exists) {
    return { id: docSnap.id, ...docSnap.data() } as Student;
  }
  return null;
}

export async function getStudentsCount(): Promise<number> {
  const studentsCollection = dbAdmin.collection('students');
  const studentsSnapshot = await studentsCollection.get();
  return studentsSnapshot.size;
}

export async function addStudent(student: Omit<Student, 'id'>): Promise<string> {
  const studentsCollection = dbAdmin.collection('students');
  const docRef = await studentsCollection.add(student);
  return docRef.id;
}
