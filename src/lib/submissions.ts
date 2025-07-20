
'use server';

import type { Submission, SubmissionStatus } from './types';
import { mockSubmissions } from './mock-data/submissions';
import { getAssignments } from './assignments';

export async function getSubmissions(): Promise<Submission[]> {
    return Promise.resolve(mockSubmissions.sort((a,b) => b.submittedAt.getTime() - a.submittedAt.getTime()));
}

export async function getNeedsReviewSubmissions(): Promise<Submission[]> {
    const assignments = await getAssignments();
    const assignmentMap = new Map(assignments.map(a => [a.id, a]));

    const needsReview = mockSubmissions.filter(s => {
      const assignment = assignmentMap.get(s.assignmentId);
      if (!assignment) return false;
      
      return s.status === 'Assigned' || s.status === 'Incomplete';
    });

    return Promise.resolve(needsReview.sort((a,b) => a.submittedAt.getTime() - b.submittedAt.getTime()));
}

export async function updateSubmission(submissionId: string, updates: Partial<{ status: SubmissionStatus; scores: { section: string; score: number }[] }>) {
  const submissionIndex = mockSubmissions.findIndex(s => s.id === submissionId);
  if (submissionIndex === -1) {
    throw new Error("Submission not found");
  }

  const updatedSubmission = {
    ...mockSubmissions[submissionIndex],
    ...updates,
  };

  mockSubmissions[submissionIndex] = updatedSubmission;

  console.log('Updated Submission:', updatedSubmission);
  
  return Promise.resolve(updatedSubmission);
}
