
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Student } from '@/lib/types';
import type { DocumentSnapshot } from 'firebase/firestore';
import { useAuth } from './use-auth';

function fromFirestore(doc: DocumentSnapshot): Student {
  const data = doc.data()!;
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
    name: data['Student Name'],
    email: data['Student Email'],
    parentEmail1: data['Parent Email 1'],
    parentEmail2: data['Parent Email 2'],
    testTypes: testTypes,
    upcomingTestDate: data['Upcoming Test Date'],
  };
  return student as Student;
}

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
        setStudents([]);
        setLoading(false);
        return;
    }
    
    setLoading(true);
    const studentsCollection = collection(db, 'students');
    
    const unsubscribe = onSnapshot(studentsCollection, (snapshot) => {
      const studentData = snapshot.docs.map(fromFirestore);
      setStudents(studentData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching students in real-time: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { students, loading };
}
