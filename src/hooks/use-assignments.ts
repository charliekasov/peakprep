
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Assignment } from '@/lib/types';
import type { DocumentSnapshot } from 'firebase/firestore';
import { useAuth } from './use-auth';
import { practiceTests } from '@/lib/assignments-data';

function fromFirebase(doc: DocumentSnapshot): Assignment {
  const data = doc.data()!;
  return {
    ...data,
    id: doc.id,
  } as Assignment;
}

export function useAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
        // If there's no user, we might not want to fetch anything,
        // or fetch public data. For now, let's just return.
        // We also clear assignments for when a user logs out.
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

        // Combine firestore assignments with hardcoded practice tests
        const allAssignments = [...firestoreAssignments, ...practiceTests];
        
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
