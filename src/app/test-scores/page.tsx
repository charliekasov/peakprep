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
import type { Submission } from '@/lib/types';

export default async function TestScoresPage() {
  const allSubmissions = await getSubmissions();
  const students = await getStudents();
  const assignments = await getAssignments();

  // Filter for completed practice tests with scores
  const scoredSubmissions = allSubmissions.filter(
    (s) =>
      s.status === 'Completed' &&
      s.scores &&
      s.scores.length > 0
  );

  const studentMap = new Map(students.map((s) => [s.id, s]));
  const assignmentMap = new Map(assignments.map((a) => [a.id, a]));

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Test Scores
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon: Score Visualization</CardTitle>
          <CardDescription>
            A chart visualizing student test scores over time will be here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
            Chart Placeholder
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Recent Scores</CardTitle>
          <CardDescription>
            A log of recently entered practice test scores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Test</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Scores</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scoredSubmissions.map((submission: Submission) => {
                const student = studentMap.get(submission.studentId);
                const assignment = assignmentMap.get(submission.assignmentId);

                return (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">
                      {student?.name || 'Unknown Student'}
                    </TableCell>
                    <TableCell>
                      {assignment?.title || 'Unknown Assignment'}
                    </TableCell>
                    <TableCell>
                      {submission.submittedAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {submission.scores
                        ?.map((s) => `${s.section}: ${s.score}`)
                        .join(', ')}
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
