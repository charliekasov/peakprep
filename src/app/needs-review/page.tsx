'use client';

import { useState, useEffect } from 'react';
import { getNeedsReviewSubmissions } from '@/lib/submissions';
import { getStudents } from '@/lib/students';
import { getAssignments } from '@/lib/assignments';
import { NeedsReviewClient } from '@/components/needs-review-client';
import { Skeleton } from '@/components/ui/skeleton';
import type { Submission, Student, Assignment } from '@/lib/types';

type EnrichedSubmission = Submission & {
  student?: Student;
  assignment?: Assignment;
};

export default function NeedsReviewPage() {
  const [enrichedSubmissions, setEnrichedSubmissions] = useState<EnrichedSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [submissions, students, assignments] = await Promise.all([
          getNeedsReviewSubmissions(),
          getStudents(),
          getAssignments(),
        ]);

        const studentMap = new Map(students.map(s => [s.id, s]));
        const assignmentMap = new Map(assignments.map(a => [a.id, a]));

        const enriched = submissions.map(submission => ({
          ...submission,
          student: studentMap.get(submission.studentId),
          assignment: assignmentMap.get(submission.assignmentId),
        }));
        setEnrichedSubmissions(enriched);
      } catch (error) {
        console.error("Failed to fetch needs review data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Needs Review
      </h1>
      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <NeedsReviewClient submissions={enrichedSubmissions} />
      )}
    </div>
  );
}
