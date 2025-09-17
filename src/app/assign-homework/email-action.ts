'use server';

import { Resend } from 'resend';

export async function sendHomeworkEmail({
  studentEmail,
  parentEmails,
  emailSubject,
  emailMessage,
  ccParents
}: {
  studentEmail: string;
  parentEmails: { parentEmail1?: string; parentEmail2?: string };
  emailSubject: string;
  emailMessage: string;
  ccParents: boolean;
}) {
  if (!process.env.RESEND_API_KEY || !process.env.FROM_EMAIL) {
    throw new Error('Email service is not configured.');
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const to = [studentEmail];
  const cc: string[] = [];
  if (ccParents) {
    if (parentEmails.parentEmail1) cc.push(parentEmails.parentEmail1);
    if (parentEmails.parentEmail2) cc.push(parentEmails.parentEmail2);
  }

  const { data, error } = await resend.emails.send({
    from: `Charlie Kasov <${process.env.FROM_EMAIL}>`,
    to: to,
    cc: cc.length > 0 ? cc : undefined,
    reply_to: process.env.REPLY_TO_EMAIL,
    subject: emailSubject,
    html: emailMessage,
  });

  if (error) {
    console.error('Resend API Error:', error);
    throw new Error('Failed to send email.');
  }

  return { success: true, data };
}