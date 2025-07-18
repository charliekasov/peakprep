import type { Student, Assignment, Submission } from './types';

export const students: Student[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    email: 'alex.j@example.com',
    profile: 'Loves science, particularly astronomy. Visual learner. Sometimes struggles with long-form writing.',
  },
  {
    id: '2',
    name: 'Brenda Smith',
    email: 'brenda.s@example.com',
    parentEmail: 'smith.fam@example.com',
    profile: 'Excels in math and logic puzzles. Prefers hands-on projects. Can be shy to ask questions.',
  },
  {
    id: '3',
    name: 'Charlie Brown',
    email: 'charlie.b@example.com',
    profile: 'Creative and enjoys history and art. Benefits from structured outlines for assignments. Good-grief.',
  },
  {
    id: '4',
    name: 'Diana Prince',
    email: 'diana.p@example.com',
    profile: 'Strong in literature and debate. A natural leader. Enjoys assignments with real-world applications.',
  },
];

export const assignments: Assignment[] = [
  {
    id: 'A1',
    title: 'Algebra II: Polynomial Functions',
    subject: 'Math',
    content: 'Complete exercises 1-20 on page 112 of the textbook. Show your work for all problems. This assignment covers factoring, graphing, and finding roots of polynomial functions.',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
  },
  {
    id: 'A2',
    title: 'The Great Gatsby: Chapter 3 Analysis',
    subject: 'English',
    content: 'Write a 500-word essay analyzing the use of symbolism in Chapter 3 of The Great Gatsby. Focus on the themes of wealth and the American Dream.',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
  },
  {
    id: 'A3',
    title: 'Photosynthesis Lab Report',
    subject: 'Science',
    content: 'Based on our in-class experiment, write a full lab report. Include a hypothesis, materials, procedure, data analysis, and conclusion.',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 10)),
  },
];

export const submissions: Submission[] = [
  {
    id: 'S1',
    assignmentId: 'A1',
    studentId: '2',
    status: 'Completed',
    submittedAt: new Date(new Date().setDate(new Date().getDate() - 2)),
    score: 95,
  },
  {
    id: 'S2',
    assignmentId: 'A2',
    studentId: '3',
    status: 'Needs Review',
    submittedAt: new Date(new Date().setDate(new Date().getDate() - 1)),
  },
  {
    id: 'S3',
    assignmentId: 'A3',
    studentId: '1',
    status: 'Needs Review',
    submittedAt: new Date(),
  },
  {
    id: 'S4',
    assignmentId: 'A1',
    studentId: '4',
    status: 'In Progress',
    submittedAt: new Date(),
  },
];


export const chartData = [
    { month: "January", score: 82 },
    { month: "February", score: 85 },
    { month: "March", score: 88 },
    { month: "April", score: 86 },
    { month: "May", score: 92 },
    { month: "June", score: 94 },
]
