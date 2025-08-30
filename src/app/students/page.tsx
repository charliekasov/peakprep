
'use client';

import { useData } from '@/context/data-provider';
import { StudentListClient } from '@/components/student-list-client';
import { Skeleton } from '@/components/ui/skeleton';

export default function StudentsPage() {
  const { students, isLoading } = useData();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      {isLoading ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <StudentListClient students={students} />
      )}
    </div>
  );
}
