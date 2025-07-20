import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getSubmissions } from '@/lib/submissions';
import { getStudents } from '@/lib/students';
import { getAssignments } from '@/lib/assignments';
import type { Submission, Student, Assignment, SubmissionStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const variant: "default" | "secondary" | "destructive" | "outline" = {
    'Assigned': 'secondary',
    'Completed': 'default',
    'Incomplete': 'destructive',
    'Did Together': 'outline',
  }[status];

  return <Badge variant={variant}>{status}</Badge>;
}

export default async function NeedsReviewPage() {
  const submissions = await getSubmissions();
  const students = await getStudents();
  const assignments = await getAssignments();

  // Create maps for quick lookup
  const studentMap = new Map(students.map(s => [s.id, s]));
  const assignmentMap = new Map(assignments.map(a => [a.id, a]));

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Needs Review
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>All Submissions</CardTitle>
          <CardDescription>
            View and manage the status of all assigned work.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Assignment</TableHead>
                <TableHead>Assigned On</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission: Submission) => {
                const student = studentMap.get(submission.studentId);
                const assignment = assignmentMap.get(submission.assignmentId);

                return (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">{student?.name || 'Unknown Student'}</TableCell>
                    <TableCell>{assignment?.title || 'Unknown Assignment'}</TableCell>
                    <TableCell>{submission.submittedAt.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <StatusBadge status={submission.status} />
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Mark as Assigned</DropdownMenuItem>
                          <DropdownMenuItem>Mark as Completed</DropdownMenuItem>
                          <DropdownMenuItem>Mark as Incomplete</DropdownMenuItem>
                          <DropdownMenuItem>Mark as "Did Together"</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
