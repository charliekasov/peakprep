# TutorFlow - A Next.js App for Tutors

This is a Next.js application built in Firebase Studio to help tutors manage students, assignments, and communications in a streamlined way.

## Getting Started

To get started, take a look at the various pages in `src/app/`. The main dashboard is `src/app/page.tsx`.

## Key Features

- **Unified Dashboard**: A central hub for managing students and assignments.
- **Student Management**: Add, view, and manage your student roster.
- **Assignment Management**: A comprehensive list of all available assignments and practice tests.
- **Assign Homework Workflow**: A dedicated interface to select a student, choose assignments/tests, and compose and send homework emails.
- **Email Automation**: Uses **Resend** to reliably send homework emails to students and parents.

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

### Scaling for Multiple Tutors

If you expand this app for multiple tutors, each tutor would need to send from a verified email address.
- **Recommended**: All tutors use email addresses from a single, verified company domain (e.g., `tutor-name@your-tutoring-company.com`). This works on Resend's free tier.
- **Alternative**: If tutors need to use their own separate business domains, you would need to verify each domain, which would likely require upgrading to a paid Resend plan.
