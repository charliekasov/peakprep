'use server';

import { z } from 'zod';
import { Resend } from 'resend';
import { getStudentById } from '@/lib/students';

const assignmentDetailsSchema = z.object({
  id: z.string(),
  sections: z.array(z.string()).optional(),
  timing: z.enum(['timed', 'untimed']).optional(),
});

const assignHomeworkSchema = z.object({
  studentId: z.string(),
  assignments: z.array(assignmentDetailsSchema),
  emailSubject: z.string(),
  emailMessage: z.string(),
  ccParents: z.boolean(),
});

export async function handleAssignHomework(input: unknown) {
  const validatedInput = assignHomeworkSchema.safeParse(input);

  if (!validatedInput.success) {
    console.error('Invalid input for handleAssignHomework:', validatedInput.error.flatten());
    throw new Error('Invalid input');
  }

  const { studentId, assignments, emailSubject, emailMessage, ccParents } = validatedInput.data;

  // Log details for debugging
  console.log('--- NEW HOMEWORK ASSIGNMENT ---');
  console.log('Student ID:', studentId);
  console.log('Assignments:', JSON.stringify(assignments, null, 2));
  console.log('Email Subject:', emailSubject);
  console.log('CC Parents:', ccParents);
  console.log('---------------------------------');

  if (!process.env.RESEND_API_KEY || !process.env.FROM_EMAIL) {
    console.error('Resend API Key or From Email is not configured in .env file.');
    throw new Error('Email service is not configured. Please check server logs.');
  }

  const student = await getStudentById(studentId);
  if (!student) {
    throw new Error('Student not found.');
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const to = [student.email];
  const cc: string[] = [];
  if (ccParents) {
    if (student.parentEmail1) cc.push(student.parentEmail1);
    if (student.parentEmail2) cc.push(student.parentEmail2);
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `TutorFlow <${process.env.FROM_EMAIL}>`,
      to: to,
      cc: cc.length > 0 ? cc : undefined,
      reply_to: 'CharlieKasov@gmail.com',
      subject: emailSubject,
      text: emailMessage, // Using text for simplicity, can be changed to html
    });

    if (error) {
      console.error('Resend API Error:', error);
      throw new Error('Failed to send email.');
    }

    console.log('Email sent successfully:', data);
    return { success: true, message: `Homework assigned and email sent to ${student.name}.` };

  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('An unexpected error occurred while sending the email.');
  }
}
