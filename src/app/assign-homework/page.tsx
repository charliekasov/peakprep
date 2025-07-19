import { AssignHomeworkClient } from '@/components/assign-homework-client';
import { getStudents } from '@/lib/students';
import { getAssignments } from '@/lib/assignments';
import { getSubmissions } from '@/lib/submissions';

export default async function AssignHomeworkPage() {
  const students = await getStudents();
  const assignments = await getAssignments();
  const submissions = await getSubmissions();

  return (
    <AssignHomeworkClient
      students={students}
      assignments={assignments}
      submissions={submissions}
    />
  );
}
