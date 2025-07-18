import type { Assignment } from '../types';

export const mockAssignments: Assignment[] = [
    {
        id: 'A1',
        title: 'Gatsby Essay',
        link: 'http://example.com/gatsby',
        subject: 'English',
        broadCategory: 'Writing',
        difficulty: 'Hard',
        testType: 'Essay',
    },
    {
        id: 'A2',
        title: 'Algebra Worksheet',
        link: 'http://example.com/algebra',
        subject: 'Math',
        broadCategory: 'Homework',
        difficulty: 'Medium',
        testType: 'Worksheet',
    },
    {
        id: 'A3',
        title: 'WWII Presentation',
        link: 'http://example.com/wwii',
        subject: 'History',
        broadCategory: 'Project',
        difficulty: 'Medium',
        testType: 'Presentation',
    },
     {
        id: 'A4',
        title: 'Astronomy Quiz',
        link: 'http://example.com/astro',
        subject: 'Science',
        broadCategory: 'Quiz',
        difficulty: 'Easy',
        testType: 'Multiple Choice',
    }
];
