'use server';

import type { Submission } from './types';
import { mockSubmissions } from './mock-data/submissions';

export async function getSubmissions(): Promise<Submission[]> {
    // In a real app, you would fetch from Firestore here.
    // For now, we're returning the mock data.
    return Promise.resolve(mockSubmissions);
}


export async function getNeedsReviewSubmissions(): Promise<Submission[]> {
    const needsReview = mockSubmissions.filter(s => s.status === 'Needs Review');
    return Promise.resolve(needsReview);
}
