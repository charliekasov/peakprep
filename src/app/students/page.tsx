
'use client';

import { StudentListClient } from '@/components/student-list-client';
import { useStudents } from '@/hooks/use-students';
import { Skeleton } from '@/components/ui/skeleton';

export default function StudentsPage() {
  const { students, loading } = useStudents();

  if (loading) {
      return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center justify-between">
                <Skeleton className="h-12 w-1/4" />
                <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-96 w-full" />
        </div>
      )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <StudentListClient students={students} />
    </div>
  );
}
