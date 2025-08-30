
'use client';

import { useMemo } from 'react';
import { NeedsReviewClient } from '@/components/needs-review-client';
import { Skeleton } from '@/components/ui/skeleton';
import type { Submission, Student, Assignment } from '@/lib/types';
import { useData } from '@/context/data-provider';

type EnrichedSubmission = Submission & {
  student?: Student;
  assignment?: Assignment;
};

export default function NeedsReviewPage() {
  const { students, assignments, submissions, isLoading } = useData();

  const enrichedSubmissions = useMemo<EnrichedSubmission[]>(() => {
    const needsReviewSubmissions = submissions
      .filter(s => s.status === 'Assigned' || s.status === 'Incomplete')
      .sort((a,b) => a.submittedAt.getTime() - b.submittedAt.getTime());

    const studentMap = new Map(students.map(s => [s.id, s]));
    const assignmentMap = new Map(assignments.map(a => [a.id, a]));

    return needsReviewSubmissions.map(submission => ({
      ...submission,
      student: studentMap.get(submission.studentId),
      assignment: assignmentMap.get(submission.assignmentId),
    }));
  }, [submissions, students, assignments]);

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
