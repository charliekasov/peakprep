"use client";

import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Users } from "lucide-react";
import type { Submission, Student, Assignment } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudents } from "@/hooks/use-students";
import { useAssignments } from "@/hooks/use-assignments";
import { useSubmissions } from "@/hooks/use-submissions";
import Link from "next/link";

function StatCard({
  title,
  value,
  icon: Icon,
  isLoading,
  href,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  isLoading?: boolean;
  href: string;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Link href={href} className="block">
      <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
        </CardContent>
      </Card>
    </Link>
  );
}

function NeedsReviewTable() {
  const { submissions, loading: submissionsLoading } = useSubmissions();
  const { students, loading: studentsLoading } = useStudents();
  const { assignments, loading: assignmentsLoading } = useAssignments();

  if (submissionsLoading || studentsLoading || assignmentsLoading) {
    return <NeedsReviewTableSkeleton />;
  }

  const needsReview = submissions
    .filter((s) => ["Assigned", "Incomplete"].includes(s.status))
    .sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime());

  return (
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
            (s: Student) => s.id === submission.studentId,
          );
          const assignment = assignments.find(
            (a: Assignment) => a.id === submission.assignmentId,
          );
          return (
            <TableRow key={submission.id}>
              <TableCell>{student?.name}</TableCell>
              <TableCell>{assignment?.["Full Assignment Name"]}</TableCell>
              <TableCell className="text-right">
                {submission.submittedAt.toLocaleDateString()}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function NeedsReviewTableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}

export default function Dashboard() {
  const { students, loading: studentsLoading } = useStudents();
  const { assignments, loading: assignmentsLoading } = useAssignments();
  const { submissions, loading: submissionsLoading } = useSubmissions();

  const isLoading = studentsLoading || assignmentsLoading || submissionsLoading;

  const activeStudents = students.filter(
    (s) => (s.status || "active") === "active",
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Welcome Back, Charlie!
      </h1>
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          title="Total Students"
          value={activeStudents.length}
          icon={Users}
          isLoading={isLoading}
          href="/students"
        />
        <StatCard
          title="Total Assignments"
          value={assignments.length}
          icon={FileText}
          isLoading={isLoading}
          href="/assignments"
        />
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-1">
        <Link href="/needs-review" className="block">
          <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle>Needs Review</CardTitle>
              <CardDescription>
                A prioritized list of assignments that require your feedback.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NeedsReviewTable />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
