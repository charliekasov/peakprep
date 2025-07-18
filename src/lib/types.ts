import type { Timestamp } from 'firebase/firestore';

export interface Student {
  id: string;
  name: string;
  email: string;
  parentEmail1?: string;
  parentEmail2?: string;
  testType?: string;
  targetScore?: string;
  rate?: number;
  frequency?: string;
  startDate?: string;
  projectedEndDate?: string;
  profile?: string;
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
}

export type Assignment = Omit<FirebaseAssignment, 'dueDate' | 'id'> & {
  id: string;
  title: string;
  dueDate?: Date;
};

export interface FirebaseSubmission {
  id:string;
  assignmentId: string;
  studentId: string;
  status: 'Not Started' | 'In Progress' | 'Submitted' | 'Needs Review' | 'Completed';
  submittedAt: Timestamp;
  score?: number;
}

export type Submission = Omit<FirebaseSubmission, 'submittedAt'> & {
    submittedAt: Date;
}