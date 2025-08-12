'use client';

import { useState, useEffect } from 'react';
import { getSubmissions } from '@/lib/submissions';
import { getStudents } from '@/lib/students';
import { getAssignments } from '@/lib/assignments';
import { TestScoresClient } from '@/components/test-scores-client';
import { Skeleton } from '@/components/ui/skeleton';
import type { Student, Assignment, Submission } from '@/lib/types';

export default function TestScoresPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [submissionsData, studentsData, assignmentsData] = await Promise.all([
          getSubmissions(),
          getStudents(),
          getAssignments(),
        ]);
        setSubmissions(submissionsData);
        setStudents(studentsData);
        setAssignments(assignmentsData);
      } catch (error) {
        console.error("Failed to fetch test scores data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);


  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      {isLoading ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-64" />
          </div>
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        <TestScoresClient
          students={students}
          assignments={assignments}
          submissions={submissions}
        />
       )}
    </div>
  );
}
