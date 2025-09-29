"use client";

import { NeedsReviewClient } from "@/components/needs-review-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAssignments } from "@/hooks/use-assignments";
import { useStudents } from "@/hooks/use-students";
import { useSubmissions } from "@/hooks/use-submissions";
import { useUserRole } from "@/hooks/use-user-role";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useMemo } from "react";
import { getAllTutors } from "@/lib/user-management";
import type { User } from "@/lib/user-roles";

export default function NeedsReviewPage() {
  const { submissions, loading: submissionsLoading } = useSubmissions();
  const { students, loading: studentsLoading } = useStudents();
  const { assignments, loading: assignmentsLoading } = useAssignments();
  const { isAdmin } = useUserRole();
  const [tutors, setTutors] = useState<User[]>([]);
  const [tutorsLoading, setTutorsLoading] = useState(true);

  // Load tutors for admin view
  useEffect(() => {
    async function loadTutors() {
      if (!isAdmin) {
        setTutorsLoading(false);
        return;
      }

      try {
        const allTutors = await getAllTutors();
        setTutors(allTutors.filter((tutor) => tutor.isActive));
      } catch (error) {
        console.error("Error loading tutors:", error);
      } finally {
        setTutorsLoading(false);
      }
    }

    loadTutors();
  }, [isAdmin]);

  const studentMap = new Map(students.map((s) => [s.id, s]));
  const assignmentMap = new Map(assignments.map((a) => [a.id, a]));
  const tutorMap = new Map(tutors.map((t) => [t.uid, t]));

  const needsReviewSubmissions = submissions
    .filter((s) => ["Assigned", "Incomplete"].includes(s.status))
    .filter((s) => studentMap.has(s.studentId));

  // Group submissions by student
  const submissionsByStudent = useMemo(() => {
    const grouped = new Map<string, typeof needsReviewSubmissions>();
    
    needsReviewSubmissions.forEach((submission) => {
      const studentId = submission.studentId;
      if (!grouped.has(studentId)) {
        grouped.set(studentId, []);
      }
      grouped.get(studentId)!.push(submission);
    });

    return Array.from(grouped.entries())
      .map(([studentId, subs]) => ({
        student: studentMap.get(studentId)!,
        submissions: subs.sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime()),
      }))
      .sort((a, b) => a.student.name.localeCompare(b.student.name));
  }, [needsReviewSubmissions, studentMap]);

  const isLoading = submissionsLoading || studentsLoading || assignmentsLoading || (isAdmin && tutorsLoading);

  if (isLoading) {
    return (
      <div className="flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Needs Review</CardTitle>
          <CardDescription>
            A prioritized list of all assignments that have been assigned or are
            incomplete.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissionsByStudent.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No assignments need review
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {submissionsByStudent.map(({ student, submissions: studentSubmissions }) => {
                const tutor = isAdmin && student.tutorId ? tutorMap.get(student.tutorId) : null;
                const enrichedSubmissions = studentSubmissions.map((submission) => ({
                  ...submission,
                  student,
                  assignment: assignmentMap.get(submission.assignmentId),
                }));

                return (
                  <AccordionItem key={student.id} value={student.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <span className="font-medium">
                          {student.name}
                          {isAdmin && tutor && (
                            <span className="text-muted-foreground font-normal"> · {tutor.displayName}</span>
                          )}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {studentSubmissions.length} {studentSubmissions.length === 1 ? 'assignment' : 'assignments'}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <NeedsReviewClient submissions={enrichedSubmissions} />
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}