'use server';

import type { Assignment } from './types';
import { mockAssignments } from './mock-data/assignments';

export async function getAssignments(): Promise<Assignment[]> {
    // Reading from mock data instead of Firestore
    return Promise.resolve(mockAssignments);
}

export async function getAssignmentById(id: string): Promise<Assignment | null> {
    const assignment = mockAssignments.find(a => a.id === id) || null;
    return Promise.resolve(assignment);
}


export async function getAssignmentsCount(): Promise<number> {
    // Reading from mock data instead of Firestore
    return Promise.resolve(mockAssignments.length);
}
