
import { TestScoresClient } from '@/components/test-scores-client';
import { getAssignments } from '@/lib/assignments';
import { getStudents } from '@/lib/students';
import { getSubmissions } from '@/lib/submissions';

export default async function TestScoresPage() {
  const students = await getStudents();
  const assignments = await getAssignments();
  const submissions = await getSubmissions();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <TestScoresClient
        students={students}
        assignments={assignments}
        submissions={submissions}
      />
    </div>
  );
}
