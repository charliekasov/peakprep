'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Assignment } from '@/lib/types';
import { fromFirebase } from '@/lib/assignments'; // Import shared function
import { useAuth } from './use-auth';
import { practiceTests } from '@/lib/assignments-data';

export function useAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setAssignments([]);
      setLoading(false);
      return;
    }

    async function fetchAssignments() {
      setLoading(true);
      try {
        const assignmentsCollection = collection(db, 'assignments');
        const assignmentsSnapshot = await getDocs(assignmentsCollection);
        const firestoreAssignments = assignmentsSnapshot.docs.map(fromFirebase);
        
        // Get IDs from firestore to prevent duplicates
        const firestoreIds = new Set(firestoreAssignments.map(a => a.id));
        
        // Filter hardcoded tests to exclude any that are already in firestore
        const uniquePracticeTests = practiceTests.filter(pt => !firestoreIds.has(pt.id));
        
        // Combine firestore assignments with the unique hardcoded practice tests
        const allAssignments = [...firestoreAssignments, ...uniquePracticeTests];
        
        setAssignments(allAssignments);
      } catch (error) {
        console.error("Error fetching assignments: ", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAssignments();
  }, [user]);

  return { assignments, loading };
}