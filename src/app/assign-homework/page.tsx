
'use client';

import { useData } from '@/context/data-provider';
import { AssignHomeworkClient } from '@/components/assign-homework-client';
import { Skeleton } from '@/components/ui/skeleton';

export default function AssignHomeworkPage() {
  const { students, assignments, submissions, isLoading } = useData();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-svh w-full" />
        </div>
      ) : (
        <AssignHomeworkClient
          students={students}
          assignments={assignments}
          submissions={submissions}
        />
      )}
    </div>
  );
}
