'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Student } from '@/lib/types';
import { fromFirestore } from '@/lib/students'; // Import shared function
import { useAuth } from './use-auth';

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
    
    const unsubscribe = onSnapshot(
      studentsCollection, 
      (snapshot) => {
        const studentData = snapshot.docs.map(fromFirestore); // Use shared function
        setStudents(studentData);
        setLoading(false);
      }, 
      (error) => {
        console.error("Error fetching students in real-time: ", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { students, loading };
}