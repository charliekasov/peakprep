import type { Timestamp } from 'firebase/firestore';

// Student types - handles dual field naming for legacy compatibility
export interface StudentFirestoreData {
  // Legacy spaced field names (stored in Firestore)
  'Student Name': string;
  'Student Email': string;
  'Parent Email 1'?: string;
  'Parent Email 2'?: string;
  'Test Types'?: string[];
  'Test Type'?: string; // Legacy singular field for backwards compatibility
  'Target Score'?: string;
  'Rate'?: number;
  'Frequency'?: string;
  'Start Date'?: string;
  'Projected End Date'?: string;
  'Upcoming Test Date'?: string;
  profile?: string;
  timeZone?: string;
  status?: 'active' | 'archived';
}

export interface Student extends StudentFirestoreData {
  id: string;
  status: 'active' | 'archived'; // Required in app logic
  
  // Clean field names for easier access (derived from spaced names)
  name: string;
  email: string;
  parentEmail1?: string;
  parentEmail2?: string;
  testTypes?: string[];
  upcomingTestDate?: string;
}

// Assignment types
export interface AssignmentFirestoreData {
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

export interface Assignment extends AssignmentFirestoreData {
  id: string;
}

// Submission types - properly separated Firebase data from app data
export type SubmissionStatus = 'Assigned' | 'Completed' | 'Incomplete' | 'Did Together';

export interface SubmissionFirestoreData {
  assignmentId: string;
  studentId: string;
  status: SubmissionStatus;
  submittedAt: Timestamp; // Firestore uses Timestamp objects
  scores?: { section: string; score: number }[];
  isOfficial?: boolean;
  officialTestName?: string;
}

export interface Submission extends Omit<SubmissionFirestoreData, 'submittedAt'> {
  id: string; // Added by document reference, not stored in Firestore data
  submittedAt: Date; // Converted from Timestamp for easier JavaScript usage
}

// Score type for better type safety
export interface TestScore {
  section: string;
  score: number;
}

// Helper types for form validation
export type StudentFormData = Omit<Student, 'id' | 'status'>;
export type SubmissionFormData = Omit<Submission, 'id' | 'submittedAt'> & {
  submittedAt?: Date;
};

// Re-export for backwards compatibility
export type FirebaseSubmission = SubmissionFirestoreData;