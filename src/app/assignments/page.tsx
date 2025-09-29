"use client";

import { useAssignments } from "@/hooks/use-assignments";
import { AssignmentsClient } from "@/components/assignments-client";
import { Skeleton } from "@/components/ui/skeleton";

export default function AssignmentsPage() {
  const { assignments, loading } = useAssignments();

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Skeleton className="h-12 w-1/4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <h1 className="font-headline text-2xl font-bold tracking-tight md:text-3xl">
        Assignment Library
      </h1>
      <AssignmentsClient assignments={assignments} />
    </div>
  );
}
