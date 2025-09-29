"use server";

import { Resend } from "resend";

export async function sendHomeworkEmail({
  studentEmail,
  parentEmails,
  emailSubject,
  emailMessage,
  ccParents,
  senderName,
  senderEmail,
  replyToEmail,
}: {
  studentEmail: string;
  parentEmails: { parentEmail1?: string; parentEmail2?: string };
  emailSubject: string;
  emailMessage: string;
  ccParents: boolean;
  senderName?: string;
  senderEmail?: string;
  replyToEmail?: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Email service is not configured.");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const to = [studentEmail];
  const cc: string[] = [];
  if (ccParents) {
    if (parentEmails.parentEmail1) cc.push(parentEmails.parentEmail1);
    if (parentEmails.parentEmail2) cc.push(parentEmails.parentEmail2);
  }

  // Use dynamic values or fall back to environment variables
  const fromName = senderName || process.env.FALLBACK_SENDER_NAME || "Peak Prep";
  const fromEmail = senderEmail || process.env.FROM_EMAIL;
  const replyTo = replyToEmail || process.env.REPLY_TO_EMAIL;
  
  if (!fromEmail) {
    throw new Error("No sender email configured.");
  }

  const { data, error } = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: to,
    cc: cc.length > 0 ? cc : undefined,
    reply_to: replyTo,
    subject: emailSubject,
    html: emailMessage,
  });

  if (error) {
    console.error("Resend API Error:", error);
    throw new Error("Failed to send email.");
  }

  return { success: true, data };
}