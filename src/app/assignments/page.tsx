
import { getAssignments } from '@/lib/assignments';
import { AssignmentsClient } from '@/components/assignments-client';

export default async function AssignmentsPage() {
  const assignments = await getAssignments();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Assignment Library
      </h1>
      <AssignmentsClient assignments={assignments} />
    </div>
  );
}
