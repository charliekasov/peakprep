"use client";

import Link from "next/link";
import { Users, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudents } from "@/hooks/use-students";
import { useAssignments } from "@/hooks/use-assignments";
import { useSubmissions } from "@/hooks/use-submissions";
import { useUserRole } from "@/hooks/use-user-role";
import type { Student, Assignment, Submission } from "@/lib/types";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  isLoading: boolean;
  href: string;
}

function StatCard({ title, value, icon: Icon, isLoading, href }: StatCardProps) {
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

function NeedsReviewCard() {
  const { submissions, loading: submissionsLoading } = useSubmissions();
  const { students, loading: studentsLoading } = useStudents();
  const { isAdmin } = useUserRole();

  if (submissionsLoading || studentsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Needs Review</CardTitle>
          <CardDescription>
            A prioritized list of assignments that require your feedback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  const studentMap = new Map(students.map((s) => [s.id, s]));

  const needsReview = submissions
    .filter((s) => ["Assigned", "Incomplete"].includes(s.status))
    .filter((s) => studentMap.has(s.studentId));

  // Count unique students with pending work
  const studentsWithWork = new Set(needsReview.map((s) => s.studentId));
  
  // For admins, count unique tutors
  let tutorCount = 0;
  if (isAdmin) {
    const tutorsWithWork = new Set(
      Array.from(studentsWithWork)
        .map(studentId => studentMap.get(studentId)?.tutorId)
        .filter(Boolean)
    );
    tutorCount = tutorsWithWork.size;
  }

  return (
    <Link href="/needs-review" className="block">
      <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle>Needs Review</CardTitle>
          <CardDescription>
            A prioritized list of assignments that require your feedback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{needsReview.length}</p>
            <p className="text-sm text-muted-foreground">
              {needsReview.length === 1 ? 'assignment' : 'assignments'} across {studentsWithWork.size} {studentsWithWork.size === 1 ? 'student' : 'students'}
              {isAdmin && tutorCount > 0 && ` (from ${tutorCount} ${tutorCount === 1 ? 'tutor' : 'tutors'})`}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Dashboard() {
  const { students, loading: studentsLoading } = useStudents();
  const { assignments, loading: assignmentsLoading } = useAssignments();
  const { submissions, loading: submissionsLoading } = useSubmissions();
  const { user } = useUserRole();

  const isLoading = studentsLoading || assignmentsLoading || submissionsLoading;

  const activeStudents = students.filter(
    (s) => (s.status || "active") === "active"
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <h1 className="font-headline text-2xl font-bold tracking-tight md:text-3xl">
        Oh hey{user?.displayName?.split(' ')[0] ? `, ${user.displayName.split(' ')[0]}` : ''}.
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
        <NeedsReviewCard />
      </div>
    </div>
  );
}