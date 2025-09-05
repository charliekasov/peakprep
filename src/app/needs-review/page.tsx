
'use client';

import { useMemo } from 'react';
import { NeedsReviewClient } from '@/components/needs-review-client';
import { Skeleton } from '@/components/ui/skeleton';
import type { Submission, Student, Assignment } from '@/lib/types';
import { useData } from '@/context/data-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type EnrichedSubmission = Submission & {
  student?: Student;
  assignment?: Assignment;
};

export default function NeedsReviewPage() {
  const { students, assignments, submissions, isLoading } = useData();

  const enrichedSubmissions = useMemo<EnrichedSubmission[]>(() => {
    // We only want to show items that are 'Assigned' or 'Incomplete'.
    // Practice tests are considered 'Assigned' until scores are entered.
    // Other assignments are also considered 'Assigned' until manually marked.
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
      <Card>
        <CardHeader>
            <CardTitle>Needs Review</CardTitle>
            <CardDescription>
                A prioritized list of all assignments that have been assigned or are
                incomplete.
            </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <NeedsReviewClient submissions={enrichedSubmissions} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
