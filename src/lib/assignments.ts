import { db, validConfig } from './firebase';
import { collection, getDocs, query, where, getCountFromServer, doc, getDoc, Timestamp } from 'firebase/firestore';
import type { Assignment, FirebaseAssignment } from './types';

const assignmentsCollection = validConfig ? collection(db, 'assignments') : null;

function toAssignment(doc: any): Assignment {
    const data = doc.data() as FirebaseAssignment;
    return {
        id: doc.id,
        ...data,
        dueDate: data.dueDate?.toDate(),
    };
}

const mockAssignments: Assignment[] = [
    { 
        id: '1', 
        title: 'Linear Functions Medium 1-14.pdf', 
        link: 'https://drive.google.com/file/d/1E32xGIJsB4qvbq_8SH9a5cu0prfvC654/view?usp=drivesdk', 
        subject: 'Algebra', 
        broadCategory: 'Math', 
        difficulty: 'Medium', 
        testType: 'SAT',
        source: 'Google Drive'
    },
    { 
        id: '2', 
        title: 'Linear Functions Difficult 1-9.pdf', 
        link: 'https://drive.google.com/file/d/1pWpjArmL9x7Et7koGkHou4A2O-6C7pIP/view?usp=drivesdk', 
        subject: 'Algebra', 
        broadCategory: 'Math', 
        difficulty: 'Hard', 
        testType: 'SAT',
        source: 'Google Drive'
    },
    { 
        id: '3', 
        title: 'Linear Functions Medium 1-14 Answers.pdf', 
        link: 'https://drive.google.com/file/d/1gkgZHiypBK_TuA-8NJdk8UBx0t-B9vXK/view?usp=drivesdk', 
        subject: 'Algebra - Answer', 
        broadCategory: 'Math', 
        difficulty: 'Medium', 
        testType: 'SAT',
        source: 'Google Drive'
    },
    { 
        id: '4', 
        title: 'Linear inequalities in one or two variables Medium 1-10.pdf', 
        link: 'https://drive.google.com/file/d/1XA0cRE7hS1rgOilwE2bQB4naKF0pZndX/view?usp=drivesdk', 
        subject: 'Algebra', 
        broadCategory: 'Math', 
        difficulty: 'Medium', 
        testType: 'SAT',
        source: 'Google Drive'
    },
    { 
        id: '5', 
        title: 'Systems of two linear equations in two variables Medium 1-9.pdf', 
        link: 'https://drive.google.com/file/d/1Z94leibGckVUQC59h3l4eP3LzaTvpc--/view?usp=drivesdk', 
        subject: 'Algebra', 
        broadCategory: 'Math', 
        difficulty: 'Medium', 
        testType: 'SAT',
        source: 'Google Drive'
    }
];


export async function getAssignments(): Promise<Assignment[]> {
    if (!validConfig || !assignmentsCollection) {
        return Promise.resolve(mockAssignments);
    }
    const snapshot = await getDocs(assignmentsCollection);
    return snapshot.docs.map(toAssignment);
}

export async function getAssignmentById(id: string): Promise<Assignment | null> {
    if (!validConfig || !assignmentsCollection) {
        return Promise.resolve(mockAssignments.find(a => a.id === id) || null);
    }
    const docRef = doc(db, 'assignments', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return toAssignment(docSnap);
    } else {
        return null;
    }
}


export async function getAssignmentsCount(): Promise<number> {
    if (!validConfig || !assignmentsCollection) {
        return Promise.resolve(mockAssignments.length);
    }
    const snapshot = await getCountFromServer(assignmentsCollection);
    return snapshot.data().count;
}
