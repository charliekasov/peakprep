import type { Submission } from '../types';

export const mockSubmissions: Submission[] = [
  {
    id: 'S1',
    assignmentId: '1',
    studentId: '1',
    status: 'Needs Review',
    submittedAt: new Date('2024-07-15T10:00:00Z'),
  },
  {
    id: 'S2',
    assignmentId: '2',
    studentId: '2',
    status: 'Completed',
    submittedAt: new Date('2024-07-14T11:30:00Z'),
    score: 95,
  },
  {
    id: 'S3',
    assignmentId: '3',
    studentId: '3',
    status: 'Needs Review',
    submittedAt: new Date('2024-07-16T09:00:00Z'),
  },
  {
    id: 'S4',
    assignmentId: '2',
    studentId: '1',
    status: 'In Progress',
    submittedAt: new Date('2024-07-18T12:00:00Z'),
  },
  {
    id: 'S5',
    assignmentId: '139',
    studentId: '5',
    status: 'Completed',
    submittedAt: new Date('2024-06-20T14:00:00Z'),
    score: 88
  },
  {
    id: 'S6',
    assignmentId: '148',
    studentId: '6',
    status: 'Completed',
    submittedAt: new Date('2024-06-22T18:00:00Z'),
    score: 92
  },
  {
    id: 'S7',
    assignmentId: '314',
    studentId: '1',
    status: 'Completed',
    submittedAt: new Date('2024-05-10T10:00:00Z'),
    score: 90
  },
   {
    id: 'S8',
    assignmentId: '320',
    studentId: '1',
    status: 'Completed',
    submittedAt: new Date('2024-05-17T10:00:00Z'),
    score: 95
  },
  {
    id: 'S9',
    assignmentId: '5',
    studentId: '4',
    status: 'Needs Review',
    submittedAt: new Date('2024-07-19T09:30:00Z'),
  },
  {
    id: 'S10',
    assignmentId: '6',
    studentId: '4',
    status: 'Needs Review',
    submittedAt: new Date('2024-07-19T09:30:00Z'),
  }
];
