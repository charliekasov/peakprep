import { db, validConfig } from './firebase';
import { collection, getDocs, getCountFromServer, doc, getDoc, addDoc } from 'firebase/firestore';
import type { Student } from './types';

const studentsCollection = validConfig ? collection(db, 'students') : null;

const mockStudents: Student[] = [
    { id: '1', name: 'Alice Johnson', email: 'alice@example.com', profile: 'Enjoys visual learning and is strong in creative writing. Sometimes needs extra encouragement in math.' },
    { id: '2', name: 'Bob Williams', email: 'bob@example.com', parentEmail: 'parentofbob@example.com', profile: 'Excels in science and is very inquisitive. Struggles with long-form essays and grammar.' },
    { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', profile: 'A diligent student who is great at following instructions. Can be hesitant to ask questions.' },
    { id: '4', name: 'Diana Prince', email: 'diana@example.com', parentEmail: 'hippolyta@example.com', profile: 'A natural leader, very organized and excels in history and social studies.' },
    { id: '5', name: 'Ethan Hunt', email: 'ethan@example.com', profile: 'Highly motivated and excels at problem-solving. Can sometimes rush through reading assignments.' },
];

export async function getStudents(): Promise<Student[]> {
    if (!validConfig || !studentsCollection) {
        return Promise.resolve(mockStudents);
    }
    const snapshot = await getDocs(studentsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
}

export async function getStudentById(id: string): Promise<Student | null> {
    if (!validConfig || !studentsCollection) {
        return Promise.resolve(mockStudents.find(s => s.id === id) || null);
    }
    const docRef = doc(db, 'students', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Student;
    } else {
        return null;
    }
}

export async function getStudentsCount(): Promise<number> {
     if (!validConfig || !studentsCollection) {
        return Promise.resolve(mockStudents.length);
    }
    const snapshot = await getCountFromServer(studentsCollection);
    return snapshot.data().count;
}

export async function addStudent(student: Omit<Student, 'id'>): Promise<string> {
    if (!validConfig || !studentsCollection) {
        console.log("Mock mode: adding student", student);
        const newId = (mockStudents.length + 1).toString();
        mockStudents.push({ id: newId, ...student });
        return Promise.resolve(newId);
    }
    const docRef = await addDoc(studentsCollection, student);
    return docRef.id;
}
