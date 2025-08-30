
'use client';

import { TestScoresClient } from '@/components/test-scores-client';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '@/context/data-provider';

export default function TestScoresPage() {
  const { students, assignments, submissions, isLoading } = useData();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      {isLoading ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-64" />
          </div>
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        <TestScoresClient
          students={students}
          assignments={assignments}
          submissions={submissions}
        />
       )}
    </div>
  );
}
