# Peak Prep - A Next.js App for Tutors

This is a Next.js application built in Firebase Studio to help tutors manage students, assignments, and communications in a streamlined way.

## Getting Started

To get started, take a look at the various pages in `src/app/`. The main dashboard is `src/app/page.tsx`.

## Key Features

- **Unified Dashboard**: A central hub for managing students and assignments.
- **Student Management**: Add, view, and manage your student roster.
- **Assignment Management**: A comprehensive list of all available assignments and practice tests.
- **Assign Homework Workflow**: A dedicated interface to select a student, choose assignments/tests, and compose and send homework emails.
- **Email Automation**: Uses **Resend** to reliably send homework emails to students and parents.
- **Data Import**: A utility script to bulk-import data from CSV files into Firestore.

---

## How to Import Your Data

To populate the application with your existing student, assignment, and submission data from a spreadsheet (like Google Sheets), you can use the provided import script.

1.  **Export to CSV**:
    *   Open your spreadsheet.
    *   Export the data for your students, assignments, and submissions into three separate CSV files: `students.csv`, `assignments.csv`, and `submissions.csv`.
    *   Ensure the column headers in your CSV files match the data fields expected by the application (e.g., `name`, `email`, `title`, `subject`, `studentId`, `assignmentId`, etc.).

2.  **Set Up Service Account**:
    *   To run the script, you need to authenticate with Firebase using a **Service Account**. This is a secure way to give the script admin access to your database.
    *   In the Firebase Console, go to **Project Settings** > **Service Accounts**.
    *   Click **Generate new private key** and save the downloaded JSON file.
    *   Place this key file in the root directory of your project.

3.  **Configure Environment**:
    *   In the `.env` file at the root of your project, add a line pointing to your key file:
        ```
        GOOGLE_APPLICATION_CREDENTIALS="your-service-account-key-file-name.json"
        ```

4.  **Prepare Files for Import**:
    *   Create a new folder named `data` in the root directory of your project.
    *   Place your `students.csv`, `assignments.csv`, and `submissions.csv` files inside this `data` folder.

5.  **Run the Script**:
    *   Open a terminal in your project's root directory.
    *   Run the following command:
        ```bash
        npm run import-data
        ```
    *   The script will log its progress in the terminal and let you know when the import is complete.

---

## How Email Sending Works (Important!)

This application uses **Resend** to send emails. It does **not** send emails directly from your personal Gmail account for critical security and deliverability reasons.

### Why Not Use Gmail Directly?
- **Security**: It would require storing your email password or sensitive credentials on the server, which is a major security risk.
- **Deliverability**: Email providers like Gmail are designed for person-to-person communication. Automated sending from a personal account can trigger spam filters, preventing your homework assignments from reaching students.

### Setting Up Resend

To enable email sending, you must have a Resend account.

1.  **Create a Free Account**: Sign up at [resend.com](https://resend.com).
2.  **Get Your API Key**: Find your API key in the Resend dashboard under the "API Keys" section.
3.  **Update Environment File**: Paste your API key into the `.env` file in the root of this project:
    ```
    RESEND_API_KEY="re_yourApiKeyHere"
    ```
4.  **Verify Your Domain**: You **must** verify a domain you own with Resend. You cannot send from `@gmail.com` or other public domains.
    - Go to the "Domains" section in Resend and follow the instructions to add the necessary DNS records to your domain provider (e.g., GoDaddy, Namecheap, Google Domains).
    - This proves you own the domain and gives Resend permission to send emails on your behalf.
5.  **Set Your From Email**: Update the `FROM_EMAIL` in the `.env` file to be an address from your newly verified domain.
    ```
    FROM_EMAIL="you@your-verified-domain.com"
    ```

When a student replies to the homework email, their response will be sent to the "Reply-To" address specified in the code (`yourname@email.com`), ensuring the conversation continues in your personal inbox.
