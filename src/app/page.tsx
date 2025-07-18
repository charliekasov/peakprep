import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  Users,
  AlertCircle,
  GraduationCap,
} from 'lucide-react';
import { getNeedsReviewSubmissions } from '@/lib/submissions';
import { getStudents, getStudentsCount } from '@/lib/students';
import { getAssignments, getAssignmentsCount } from '@/lib/assignments';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { StudentPerformanceChart } from '@/components/student-performance-chart';
import type { Submission, Student, Assignment } from '@/lib/types';

export default async function Dashboard() {
  const needsReviewCount = (await getNeedsReviewSubmissions()).length;
  const needsReview = await getNeedsReviewSubmissions();
  const students = await getStudents();
  const assignments = await getAssignments();
  const studentsCount = await getStudentsCount();
  const assignmentsCount = await getAssignmentsCount();


  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Welcome Back, Tutor!
      </h1>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentsCount}</div>
            <p className="text-xs text-muted-foreground">
              Actively managed students
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Assignments
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignmentsCount}</div>
            <p className="text-xs text-muted-foreground">
              Across all subjects
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{needsReviewCount}</div>
            <p className="text-xs text-muted-foreground">
              Assignments awaiting feedback
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Needs Review</CardTitle>
            <CardDescription>
              Assignments submitted by students that require your feedback.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead className="text-right">Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {needsReview.slice(0, 5).map((submission) => {
                  const student = students.find(
                    (s: Student) => s.id === submission.studentId
                  );
                  const assignment = assignments.find(
                    (a: Assignment) => a.id === submission.assignmentId
                  );
                  return (
                    <TableRow key={submission.id}>
                      <TableCell>{student?.name}</TableCell>
                      <TableCell>{assignment?.title}</TableCell>
                      <TableCell className="text-right">
                        {submission.submittedAt.toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <StudentPerformanceChart />

      </div>
    </div>
  );
}
