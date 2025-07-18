'use server';

import type { Student } from './types';
import { mockStudents } from './mock-data/students';
import { db } from './firebase';
import { addDoc, collection } from 'firebase/firestore';

export async function getStudents(): Promise<Student[]> {
  // Return mock data for now
  return Promise.resolve(mockStudents);
}

export async function getStudentById(id: string): Promise<Student | null> {
  const student = mockStudents.find((s) => s.id === id);
  return Promise.resolve(student || null);
}

export async function getStudentsCount(): Promise<number> {
  return Promise.resolve(mockStudents.length);
}

export async function addStudent(student: Omit<Student, 'id'>): Promise<string> {
    const studentsCollection = collection(db, 'students');
    const docRef = await addDoc(studentsCollection, student);
    return docRef.id;
}
