
import { NeedsReviewClient } from '@/components/needs-review-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAssignments } from '@/lib/assignments';
import { getStudents } from '@/lib/students';
import { getNeedsReviewSubmissions } from '@/lib/submissions';

export default async function NeedsReviewPage() {
  const needsReviewSubmissions = await getNeedsReviewSubmissions();
  const students = await getStudents();
  const assignments = await getAssignments();

  const studentMap = new Map(students.map(s => [s.id, s]));
  const assignmentMap = new Map(assignments.map(a => [a.id, a]));

  const enrichedSubmissions = needsReviewSubmissions.map(submission => ({
    ...submission,
    student: studentMap.get(submission.studentId),
    assignment: assignmentMap.get(submission.assignmentId),
  }));

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
