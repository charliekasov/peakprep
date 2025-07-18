import { db } from './firebase';
import { collection, getDocs, getCountFromServer, doc, getDoc, addDoc } from 'firebase/firestore';
import type { Student } from './types';

const studentsCollection = collection(db, 'students');

export async function getStudents(): Promise<Student[]> {
    const snapshot = await getDocs(studentsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
}

export async function getStudentById(id: string): Promise<Student | null> {
    const docRef = doc(db, 'students', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Student;
    } else {
        return null;
    }
}

export async function getStudentsCount(): Promise<number> {
    const snapshot = await getCountFromServer(studentsCollection);
    return snapshot.data().count;
}

export async function addStudent(student: Omit<Student, 'id'>): Promise<string> {
    const docRef = await addDoc(studentsCollection, student);
    return docRef.id;
}
