"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Submission } from "@/lib/types";
import { fromFirebase } from "@/lib/submissions"; // Import shared function
import { useAuth } from "./use-auth";

export function useSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setSubmissions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const submissionsCollection = collection(db, "submissions");

    const unsubscribe = onSnapshot(
      submissionsCollection,
      (snapshot) => {
        const submissionData = snapshot.docs
          .map(fromFirebase) // Use shared transformation function
          .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
        setSubmissions(submissionData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching submissions in real-time: ", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  return { submissions, loading };
}
