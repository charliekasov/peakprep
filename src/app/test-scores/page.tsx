"use client";

import { TestScoresClient } from "@/components/test-scores-client";
import { useAssignments } from "@/hooks/use-assignments";
import { useStudents } from "@/hooks/use-students";
import { useSubmissions } from "@/hooks/use-submissions";
import { Skeleton } from "@/components/ui/skeleton";

export default function TestScoresPage() {
  const { students, loading: studentsLoading } = useStudents();
  const { assignments, loading: assignmentsLoading } = useAssignments();
  const { submissions, loading: submissionsLoading } = useSubmissions();

  const isLoading = studentsLoading || assignmentsLoading || submissionsLoading;

  if (isLoading) {
    return (
      <div className="flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="space-y-4">
          <Skeleton className="h-12 w-1/4" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

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
