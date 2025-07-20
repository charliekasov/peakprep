
import { getNeedsReviewSubmissions } from '@/lib/submissions';
import { getStudents } from '@/lib/students';
import { getAssignments } from '@/lib/assignments';
import { NeedsReviewClient } from '@/components/needs-review-client';

export default async function NeedsReviewPage() {
  const submissions = await getNeedsReviewSubmissions();
  const students = await getStudents();
  const assignments = await getAssignments();

  // Create maps for quick lookup
  const studentMap = new Map(students.map(s => [s.id, s]));
  const assignmentMap = new Map(assignments.map(a => [a.id, a]));

  const enrichedSubmissions = submissions.map(submission => ({
    ...submission,
    student: studentMap.get(submission.studentId),
    assignment: assignmentMap.get(submission.assignmentId),
  }));

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Needs Review
      </h1>
      <NeedsReviewClient submissions={enrichedSubmissions} />
    </div>
  );
}
