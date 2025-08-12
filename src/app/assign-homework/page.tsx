'use client';

import { useState, useEffect } from 'react';
import { AssignHomeworkClient } from '@/components/assign-homework-client';
import { getStudents } from '@/lib/students';
import { getAssignments } from '@/lib/assignments';
import { getSubmissions } from '@/lib/submissions';
import { Skeleton } from '@/components/ui/skeleton';
import type { Student, Assignment, Submission } from '@/lib/types';

export default function AssignHomeworkPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [studentsData, assignmentsData, submissionsData] = await Promise.all([
          getStudents(),
          getAssignments(),
          getSubmissions(),
        ]);
        setStudents(studentsData);
        setAssignments(assignmentsData);
        setSubmissions(submissionsData);
      } catch (error) {
        console.error("Failed to fetch data for assignment page:", error);
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
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-svh w-full" />
        </div>
      ) : (
        <AssignHomeworkClient
          students={students}
          assignments={assignments}
          submissions={submissions}
        />
      )}
    </div>
  );
}
