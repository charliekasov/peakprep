
import { StudentListClient } from '@/components/student-list-client';
import { getStudents } from '@/lib/students';

export default async function StudentsPage() {
  const students = await getStudents();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <StudentListClient students={students} />
    </div>
  );
}
