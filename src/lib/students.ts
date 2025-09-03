'use client';

import { collection, getDocs, getDoc, doc, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Student } from './types';

// Helper function to map Firestore data to our Student type
function fromFirestore(doc: any): Student {
  const data = doc.data();
  const student: Partial<Student> = {
    id: doc.id,
    'Student Name': data['Student Name'],
    'Student Email': data['Student Email'],
    'Parent Email 1': data['Parent Email 1'],
    'Parent Email 2': data['Parent Email 2'],
    'Test Type': data['Test Type'],
    'Target Score': data['Target Score'],
    'Rate': data['Rate'],
    'Frequency': data['Frequency'],
    'Start Date': data['Start Date'],
    'Projected End Date': data['Projected End Date'],
    'Upcoming Test Date': data['Upcoming Test Date'],
    profile: data['profile'],
    
    // For backwards compatibility with components that might still use the old names
    name: data['Student Name'],
    email: data['Student Email'],
    parentEmail1: data['Parent Email 1'],
    parentEmail2: data['Parent Email 2'],
    testType: data['Test Type'],
    upcomingTestDate: data['Upcoming Test Date'],
  };
  return student as Student;
}


export async function getStudents(): Promise<Student[]> {
  const studentsCollection = collection(db, 'students');
  const studentsSnapshot = await getDocs(studentsCollection);
  const students = studentsSnapshot.docs.map(fromFirestore);
  return students;
}

export async function getStudentById(id: string): Promise<Student | null> {
  const docRef = doc(db, 'students', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return fromFirestore(docSnap);
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
