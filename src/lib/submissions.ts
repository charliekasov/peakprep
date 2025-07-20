'use server';

import type { Submission } from './types';
import { mockSubmissions } from './mock-data/submissions';

export async function getSubmissions(): Promise<Submission[]> {
    // In a real app, you would fetch from Firestore here.
    // For now, we're returning the mock data.
    return Promise.resolve(mockSubmissions.sort((a,b) => b.submittedAt.getTime() - a.submittedAt.getTime()));
}


export async function getNeedsReviewSubmissions(): Promise<Submission[]> {
    const needsReview = mockSubmissions.filter(s => {
      // It needs review if it's assigned OR if it's completed but has no scores yet.
      const isCompletedWithoutScore = s.status === 'Completed' && (!s.scores || s.scores.length === 0);
      return s.status === 'Assigned' || s.status === 'Incomplete' || isCompletedWithoutScore;
    });
    return Promise.resolve(needsReview);
}
