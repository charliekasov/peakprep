export interface Student {
  id: string;
  name: string;
  email: string;
  parentEmail?: string;
  profile: string;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  content: string;
  dueDate: Date;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  status: 'Not Started' | 'In Progress' | 'Submitted' | 'Needs Review' | 'Completed';
  submittedAt: Date;
  score?: number;
}
