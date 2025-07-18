'use server';

import type { Student } from './types';
import { mockStudents } from './mock-data/students';

export async function getStudents(): Promise<Student[]> {
  // Reading from mock data instead of Firestore
  return Promise.resolve(mockStudents);
}

export async function getStudentById(id: string): Promise<Student | null> {
  const student = mockStudents.find((s) => s.id === id) || null;
  return Promise.resolve(student);
}

export async function getStudentsCount(): Promise<number> {
  // Reading from mock data instead of Firestore
  return Promise.resolve(mockStudents.length);
}

export async function addStudent(student: Omit<Student, 'id'>): Promise<string> {
    // This function will need to be updated to work with a database later.
    const newStudent = { ...student, id: (mockStudents.length + 1).toString() };
    mockStudents.push(newStudent);
    return Promise.resolve(newStudent.id);
}