"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Student } from "@/lib/types";
import { fromFirestore } from "@/lib/students";
import { useUserRole } from "@/hooks/use-user-role";

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin, isLoading: roleLoading } = useUserRole();

  useEffect(() => {
    // Wait for role information to load
    if (roleLoading || !user) {
      setStudents([]);
      setLoading(roleLoading);
      return;
    }

    setLoading(true);

    let studentsQuery;

    if (isAdmin) {
      // Admins can see all students
      studentsQuery = collection(db, "students");
    } else {
      // Regular tutors only see their assigned students
      studentsQuery = query(
        collection(db, "students"),
        where("tutorId", "==", user.uid),
      );
    }

    const unsubscribe = onSnapshot(
      studentsQuery,
      (snapshot) => {
        const studentData = snapshot.docs.map(fromFirestore);
        setStudents(studentData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching students in real-time: ", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user, isAdmin, roleLoading]);

  return { students, loading };
}
