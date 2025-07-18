import type { Student } from '../types';

export const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice.j@example.com',
    profile: 'Loves science, particularly astronomy. Visual learner. Sometimes struggles with long-form writing.',
  },
  {
    id: '2',
    name: 'Bob Williams',
    email: 'bob.w@example.com',
    parentEmail: 'parent.w@example.com',
    profile: 'Strong in math and logic. Prefers hands-on projects. Needs encouragement in creative writing.',
  },
  {
    id: '3',
    name: 'Charlie Brown',
    email: 'charlie.b@example.com',
    profile: 'Enjoys history and social studies. A bit shy but participates well in group discussions.',
  },
];
