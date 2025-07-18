'use server';

import type { Assignment } from './types';
import { mockAssignments } from './mock-data/assignments';

export async function getAssignments(): Promise<Assignment[]> {
    // Return mock data for now
    return Promise.resolve(mockAssignments);
}

export async function getAssignmentById(id: string): Promise<Assignment | null> {
    const assignment = mockAssignments.find((a) => a.id === id);
    return Promise.resolve(assignment || null);
}


export async function getAssignmentsCount(): Promise<number> {
    return Promise.resolve(mockAssignments.length);
}
