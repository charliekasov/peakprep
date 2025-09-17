# Codebase Documentation: Peak Prep Tutor App

This document provides a comprehensive overview of the Peak Prep application for both product and engineering stakeholders.

---

## 1. Executive Summary (For Product Managers)

### 1.1. Application Purpose

**Peak Prep** is a web application designed to be a central command center for a private tutor. It streamlines the administrative tasks of managing students, creating and assigning homework, tracking progress, and communicating with students and parents, allowing the tutor to focus more on teaching.

### 1.2. Key Features

The application is built around a few core workflows:

*   **Unified Dashboard**: Provides an at-a-glance overview of key metrics, including the number of students, total assignments, and a list of submissions that need immediate review.
*   **Student Management**: A complete roster of all students. Tutors can add new students and view detailed profiles, including contact information, test schedules, and qualitative notes.
*   **Assignment & Test Library**: A centralized repository of all available assignments, worksheets, and practice tests, filterable and searchable.
*   **Assign Homework Workflow**: A dedicated, multi-step interface for assigning homework. A tutor selects a student, chooses one or more assignments/tests from the library, and then composes and sends a formatted email notification.
*   **Email Automation**: Integrates with the **Resend** email service to reliably send assignment notifications. It can CC parents and is configured to ensure replies go directly to the tutor's personal inbox.
*   **Needs Review Queue**: A prioritized list of all assignments that have been marked as "Assigned" or "Incomplete," allowing the tutor to easily track what needs grading or follow-up.
*   **Test Score Tracking**: Visualizes student performance on practice tests over time with charts, helping to identify trends and areas for improvement.
*   **AI Subject Line Generator**: An auxiliary tool that uses Genkit AI to generate engaging email subject lines based on student profiles and assignment content, aiming to improve student engagement.

### 1.3. Technology Stack

*   **Framework**: Next.js (React)
*   **Database & Authentication**: Google Firebase (Firestore & Firebase Auth)
*   **UI Components**: ShadCN UI & Tailwind CSS
*   **Generative AI**: Google AI via Genkit
*   **Email Service**: Resend

---

## 2. Technical Architecture (For Senior Engineers)

### 2.1. Frontend Architecture

The application is built using the **Next.js App Router**, heavily utilizing **React Server Components (RSC)** by default to minimize the client-side JavaScript bundle and improve performance.

*   **Routing & Layouts**: The file structure under `src/app/` defines the routes. The root layout (`src/app/layout.tsx`) establishes the main HTML structure and includes global providers for authentication and data. It also manages the primary sidebar navigation.
*   **Component Model**:
    *   **UI Primitives**: Located in `src/components/ui`, these are core, unstyled components from ShadCN (e.g., `Button`, `Card`, `Input`).
    *   **Application Components**: Located in `src/components`, these are the larger, composite components that build the application's features (e.g., `student-list-client.tsx`, `assign-homework-client.tsx`). Many of these are client components (`'use client'`) because they manage state and handle user interactions.
*   **Styling**: Styling is handled by **Tailwind CSS**. A base theme with CSS variables is defined in `src/app/globals.css`, which is consistent with the ShadCN methodology.

### 2.2. State Management

*   **Authentication State**: The `useAuth` hook (`src/hooks/use-auth.tsx`) provides the current user's authentication status and loading state throughout the app. It wraps the core Firebase `onAuthStateChanged` listener and handles automatic redirection to the login page for unauthenticated users.
*   **Global Application Data**: A global `DataProvider` (`src/context/data-provider.tsx`) fetches all primary data (students, assignments, submissions) from Firestore upon application load. This data is made available via the `useData` hook. This approach simplifies data access across various components but means that data is currently only fetched once on load. A `refetchData` function is provided to manually trigger a refresh, used after mutations like adding a student.

### 2.3. Backend & Data Layer

*   **Database**: **Firestore (NoSQL)** is the primary database. Collections include `students`, `assignments`, and `submissions`.
*   **Data Access**:
    *   Client-side reads are handled by functions in `src/lib/students.ts`, `src/lib/assignments.ts`, and `src/lib/submissions.ts`. These functions use the Firebase client SDK.
    *   The data import script (`scripts/import-data.ts`) uses the **Firebase Admin SDK** for privileged write access, requiring service account credentials.
*   **Data Models**: Type definitions for all major data entities (`Student`, `Assignment`, `Submission`) are centralized in `src/lib/types.ts`. These types are crucial for ensuring consistency between Firestore documents and the application code.

### 2.4. Server-Side Logic (Mutations)

*   **Next.js Server Actions**: The application uses Server Actions to handle all data mutations (writes/updates). This avoids the need to create traditional API endpoints.
*   **Implementation**: Action files (e.g., `src/app/students/actions.ts`) are marked with `'use server'`. They define functions that can be directly imported and called from client components. These actions handle form validation (using Zod), interact with the database, and trigger cache revalidation (`revalidatePath`) to update the UI.


### 2.5. Key Files & Directories

*   `src/app/`: Contains all pages and routes.
*   `src/components/`: Contains all React components.
    *   `ui/`: Core ShadCN components.
*   `src/lib/`: Contains core logic, including Firebase configuration (`firebase.ts`), data type definitions (`types.ts`), and Firestore data access functions.
*   `src/context/`: Contains React Context providers for global state (`data-provider.tsx`).
*   `src/hooks/`: Contains custom React hooks (`use-auth.ts`, `use-toast.ts`).
*   `src/ai/`: Contains all Genkit AI configurations and flows.
*   `scripts/`: Contains utility scripts, like the data importer.
*   `ref/`: Contains project documentation like this file.
