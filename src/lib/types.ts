
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
  profile?: string; 
  name: string;
  email: string;
  parentEmail1?: string;
  parentEmail2?: string;
  testType?: string;
  upcomingTestDate?: string;
}

export interface FirebaseAssignment {
  'Full Assignment Name': string;
  'Link': string;
  'Subject': string;
  'Broad Category': string;
  'Difficulty': 'Easy' | 'Medium' | 'Hard';
  'Test Type'?: string;
  'Source'?: string;
  'isPracticeTest'?: boolean;
  'isOfficialTest'?: boolean;
}

export type Assignment = FirebaseAssignment & {
  id: string;
};

export type SubmissionStatus = 'Assigned' | 'Completed' | 'Incomplete' | 'Did Together';

export interface FirebaseSubmission {
  id:string;
  assignmentId: string;
  studentId: string;
  status: SubmissionStatus;
  submittedAt: Timestamp;
  scores?: { section: string; score: number }[];
  isOfficial?: boolean;
}

export type Submission = Omit<FirebaseSubmission, 'submittedAt' | 'id'> & {
    id: string;
    submittedAt: Date;
}
