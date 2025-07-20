import { getSubmissions } from '@/lib/submissions';
import { getStudents } from '@/lib/students';
import { getAssignments } from '@/lib/assignments';
import { TestScoresClient } from '@/components/test-scores-client';

export default async function TestScoresPage() {
  const allSubmissions = await getSubmissions();
  const students = await getStudents();
  const assignments = await getAssignments();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <TestScoresClient
        students={students}
        assignments={assignments}
        submissions={allSubmissions}
      />
    </div>
  );
}
