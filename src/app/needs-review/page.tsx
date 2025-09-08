
'use client';

import { NeedsReviewClient } from '@/components/needs-review-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAssignments } from '@/hooks/use-assignments';
import { useStudents } from '@/hooks/use-students';
import { useSubmissions } from '@/hooks/use-submissions';
import { Skeleton } from '@/components/ui/skeleton';

export default function NeedsReviewPage() {
  const { submissions, loading: submissionsLoading } = useSubmissions();
  const { students, loading: studentsLoading } = useStudents();
  const { assignments, loading: assignmentsLoading } = useAssignments();

  const isLoading = submissionsLoading || studentsLoading || assignmentsLoading;

  if (isLoading) {
    return (
        <div className="flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <Skeleton className="h-96 w-full" />
        </div>
    );
  }
  
  const needsReviewSubmissions = submissions.filter(s => ['Assigned', 'Incomplete'].includes(s.status));
  const studentMap = new Map(students.map(s => [s.id, s]));
  const assignmentMap = new Map(assignments.map(a => [a.id, a]));

  const enrichedSubmissions = needsReviewSubmissions.map(submission => ({
    ...submission,
    student: studentMap.get(submission.studentId),
    assignment: assignmentMap.get(submission.assignmentId),
  })).sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime());

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
          <NeedsReviewClient submissions={enrichedSubmissions} />
        </CardContent>
      </Card>
    </div>
  );
}
