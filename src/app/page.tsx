
'use client';

import { useMemo } from 'react';
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
} from 'lucide-react';
import Link from 'next/link';
import { StudentPerformanceChart } from '@/components/student-performance-chart';
import type { Submission, Student, Assignment } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '@/context/data-provider';

function StatCard({ title, value, icon: Icon, isLoading }: { title: string, value: number, icon: React.ElementType, isLoading: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-1/4" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}


export default function Dashboard() {
  const { students, assignments, submissions, isLoading } = useData();

  const needsReview = useMemo(() => {
    return submissions
      .filter(s => s.status === 'Assigned' || s.status === 'Incomplete')
      .sort((a,b) => a.submittedAt.getTime() - b.submittedAt.getTime());
  }, [submissions]);

  const studentsCount = useMemo(() => students.length, [students]);
  const assignmentsCount = useMemo(() => assignments.length, [assignments]);


  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Welcome Back, Tutor!
      </h1>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <StatCard title="Total Students" value={studentsCount} icon={Users} isLoading={isLoading} />
        <StatCard title="Total Assignments" value={assignmentsCount} icon={FileText} isLoading={isLoading} />
        <StatCard title="Needs Review" value={needsReview.length} icon={AlertCircle} isLoading={isLoading} />
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
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>

        <StudentPerformanceChart />

      </div>
    </div>
  );
}
