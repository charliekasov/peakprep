
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getStudents } from '@/lib/students';
import { getAssignments } from '@/lib/assignments';
import { getSubmissions } from '@/lib/submissions';
import type { Student, Assignment, Submission } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';

interface DataContextProps {
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
  isLoading: boolean;
  error: Error | null;
  refetchData: () => void;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    // Only fetch data if the user is logged in.
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const [studentsData, assignmentsData, submissionsData] = await Promise.all([
        getStudents(),
        getAssignments(),
        getSubmissions(),
      ]);
      setStudents(studentsData);
      setAssignments(assignmentsData);
      setSubmissions(submissionsData);
    } catch (err: any) {
      console.error("Failed to fetch all data:", err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const refetchData = () => {
    fetchData();
  };

  return (
    <DataContext.Provider value={{ students, assignments, submissions, isLoading, error, refetchData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
