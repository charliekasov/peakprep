'use server';

import type { Submission } from './types';
import { mockSubmissions } from './mock-data/submissions';


export async function getSubmissions(): Promise<Submission[]> {
    // Return mock data for now
    return Promise.resolve(mockSubmissions);
}

export async function getNeedsReviewSubmissions(): Promise<Submission[]> {
    const needsReview = mockSubmissions.filter(s => s.status === 'Needs Review');
    return Promise.resolve(needsReview);
}
