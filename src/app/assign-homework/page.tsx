import { AssignHomeworkClient } from '@/components/assign-homework-client';
import { getStudents } from '@/lib/students';
import { getAssignments } from '@/lib/assignments';

export default async function AssignHomeworkPage() {
  const students = await getStudents();
  const assignments = await getAssignments();

  // We pass the data to a client component to handle the interactivity.
  return <AssignHomeworkClient students={students} assignments={assignments} />;
}
