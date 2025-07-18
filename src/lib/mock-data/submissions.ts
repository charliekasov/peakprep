import type { Submission } from '../types';

export const mockSubmissions: Submission[] = [
  {
    id: 'S1',
    assignmentId: 'A1',
    studentId: '1',
    status: 'Needs Review',
    submittedAt: new Date('2024-07-15T10:00:00Z'),
  },
  {
    id: 'S2',
    assignmentId: 'A2',
    studentId: '2',
    status: 'Completed',
    submittedAt: new Date('2024-07-14T11:30:00Z'),
    score: 95,
  },
  {
    id: 'S3',
    assignmentId: 'A3',
    studentId: '3',
    status: 'Needs Review',
    submittedAt: new Date('2024-07-16T09:00:00Z'),
  },
  {
    id: 'S4',
    assignmentId: 'A2',
    studentId: '1',
    status: 'In Progress',
    submittedAt: new Date(),
  },
];
