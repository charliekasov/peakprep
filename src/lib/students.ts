
'use client';

import { collection, getDocs, getDoc, doc, addDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import type { Student } from './types';

// Helper function to map Firestore data to our Student type
function fromFirestore(doc: any): Student {
  const data = doc.data();
  // Ensure testTypes is an array for consistency
  const testTypes = Array.isArray(data['Test Types']) ? data['Test Types'] : (data['Test Type'] ? [data['Test Type']] : []);

  const student: Partial<Student> = {
    id: doc.id,
    'Student Name': data['Student Name'],
    'Student Email': data['Student Email'],
    'Parent Email 1': data['Parent Email 1'],
    'Parent Email 2': data['Parent Email 2'],
    'Test Types': testTypes,
    'Target Score': data['Target Score'],
    'Rate': data['Rate'],
    'Frequency': data['Frequency'],
    'Start Date': data['Start Date'],
    'Projected End Date': data['Projected End Date'],
    'Upcoming Test Date': data['Upcoming Test Date'],
    profile: data.profile,
    timeZone: data.timeZone,
    status: data.status || 'active', // Default to active if not set
    
    // For backwards compatibility and easier access
    name: data.name || data['Student Name'],
    email: data.email || data['Student Email'],
    parentEmail1: data.parentEmail1 || data['Parent Email 1'],
    parentEmail2: data.parentEmail2 || data['Parent Email 2'],
    testTypes: testTypes,
    upcomingTestDate: data.upcomingTestDate || data['Upcoming Test Date'],
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

export async function addStudent(student: Omit<Student, 'id' | 'status'>): Promise<string> {
  const studentsCollection = collection(db, 'students');
  
  const studentForFirestore = {
    'Student Name': student.name,
    'Student Email': student.email,
    'Parent Email 1': student.parentEmail1,
    'Parent Email 2': student.parentEmail2,
    'Test Types': student.testTypes,
    'Upcoming Test Date': student.upcomingTestDate,
    'Rate': student.Rate,
    'Frequency': student.Frequency,
    'timeZone': student.timeZone,
    'profile': student.profile,
    status: 'active'
  };

  // Remove undefined keys to keep Firestore clean
  Object.keys(studentForFirestore).forEach(key => {
    if (studentForFirestore[key as keyof typeof studentForFirestore] === undefined) {
      delete studentForFirestore[key as keyof typeof studentForFirestore];
    }
  });


  const docRef = await addDoc(studentsCollection, studentForFirestore);
  return docRef.id;
}

export async function updateStudent(id: string, student: Partial<Omit<Student, 'id' | 'status'>>) {
  const studentRef = doc(db, 'students', id);
  
  const studentForFirestore = {
    'Student Name': student.name,
    'Student Email': student.email,
    'Parent Email 1': student.parentEmail1,
    'Parent Email 2': student.parentEmail2,
    'Test Types': student.testTypes,
    'Upcoming Test Date': student.upcomingTestDate,
    'Rate': student.Rate,
    'Frequency': student.Frequency,
    'timeZone': student.timeZone,
    'profile': student.profile,
  };

  // Remove undefined keys
  Object.keys(studentForFirestore).forEach(key => {
    if (studentForFirestore[key as keyof typeof studentForFirestore] === undefined) {
      delete studentForFirestore[key as keyof typeof studentForFirestore];
    }
  });


  await updateDoc(studentRef, studentForFirestore);
}

export async function archiveStudent(id: string) {
    const studentRef = doc(db, 'students', id);
    await updateDoc(studentRef, { status: 'archived' });
}

export async function unarchiveStudent(id: string) {
    const studentRef = doc(db, 'students', id);
    await updateDoc(studentRef, { status: 'active' });
}
