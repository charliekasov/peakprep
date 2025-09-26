"use client";

import { StudentListClient } from "@/components/student-list-client";
import { useStudents } from "@/hooks/use-students";
import { useUserRole } from "@/hooks/use-user-role";
import { getAllTutors } from "@/lib/user-management";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useMemo } from "react";
import type { Student } from "@/lib/types";
import type { User } from "@/lib/user-roles";

export default function StudentsPage() {
  const { students, loading } = useStudents();
  const { user, isAdmin, isLoading: userLoading } = useUserRole();
  const [tutors, setTutors] = useState<User[]>([]);
  const [tutorsLoading, setTutorsLoading] = useState(true);

  // Load all tutors for admin view
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

    if (!userLoading && isAdmin) {
      loadTutors();
    }
  }, [isAdmin, userLoading]);

  // Prepare student data for the enhanced component
  const enhancedStudentData = useMemo(() => {
    if (!user || !students.length) {
      return {
        myStudents: [],
        supervisedStudents: [],
        tutorGroups: {},
      };
    }

    const myStudents = students.filter(
      (student) => student.tutorId === user.uid,
    );
    const supervisedStudents = students.filter(
      (student) => student.tutorId !== user.uid && student.tutorId,
    );

    // Group supervised students by tutor for better organization
    const tutorGroups: Record<string, { tutor: User; students: Student[] }> =
      {};

    supervisedStudents.forEach((student) => {
      if (student.tutorId) {
        const tutor = tutors.find((t) => t.uid === student.tutorId);
        if (tutor) {
          if (!tutorGroups[student.tutorId]) {
            tutorGroups[student.tutorId] = { tutor, students: [] };
          }
          tutorGroups[student.tutorId].students.push(student);
        }
      }
    });

    return { myStudents, supervisedStudents, tutorGroups };
  }, [students, user, tutors]);

  if (loading || userLoading || (isAdmin && tutorsLoading)) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-12 w-1/4" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <StudentListClient
        students={enhancedStudentData.myStudents}
        supervisedStudents={enhancedStudentData.supervisedStudents}
        tutorGroups={enhancedStudentData.tutorGroups}
        isAdmin={isAdmin}
      />
    </div>
  );
}
