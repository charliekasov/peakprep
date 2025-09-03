import type { Timestamp } from 'firebase/firestore';

export interface Student {
  id: string;
  'Student Name': string;
  'Student Email': string;
  'Parent Email 1'?: string;
  'Parent Email 2'?: string;
  'Test Type'?: string;
  'Target Score'?: string;
  'Rate'?: number;
  'Frequency'?: string;
  'Start Date'?: string;
  'Projected End Date'?: string;
  'Upcoming Test Date'?: string;
  profile?: string; // This field was in the original form, keeping it for now.
  // Mapped old fields to new ones for compatibility where needed, but it's better to update components.
  name: string;
  email: string;
  parentEmail1?: string;
  parentEmail2?: string;
  testType?: string;
  upcomingTestDate?: string;
}

export interface FirebaseAssignment {
  id: string;
  title: string;
  link: string;
  subject: string;
  broadCategory: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  testType?: string;
  source?: string;
  dueDate?: Timestamp;
  isPracticeTest?: boolean;
}

export type Assignment = Omit<FirebaseAssignment, 'dueDate' | 'id'> & {
  id: string;
  title: string;
  dueDate?: Date;
};

export type SubmissionStatus = 'Assigned' | 'Completed' | 'Incomplete' | 'Did Together';

export interface FirebaseSubmission {
  id:string;
  assignmentId: string;
  studentId: string;
  status: SubmissionStatus;
  submittedAt: Timestamp;
  scores?: { section: string; score: number }[];
}

export type Submission = Omit<FirebaseSubmission, 'submittedAt' | 'id'> & {
    id: string;
    submittedAt: Date;
}
