'use server';

import { addStudent } from '@/lib/students';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const studentSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  parentEmail1: z.string().email({ message: 'Please enter a valid email.' }).optional().or(z.literal('')),
  parentEmail2: z.string().email({ message: 'Please enter a valid email.' }).optional().or(z.literal('')),
  profile: z.string().min(10, {
    message: 'Profile must be at least 10 characters.',
  }),
  upcomingTestDate: z.string().optional(),
});

export async function handleAddStudent(data: unknown) {
  const validatedFields = studentSchema.safeParse(data);

  if (!validatedFields.success) {
    // We can be more specific with errors in a real app
    throw new Error('Invalid student data.');
  }
  
  const studentData = validatedFields.data;

  try {
    // If parentEmails are empty strings, remove them before saving
    if (studentData.parentEmail1 === '') {
      delete studentData.parentEmail1;
    }
    if (studentData.parentEmail2 === '') {
      delete studentData.parentEmail2;
    }
    
    await addStudent(studentData);
    revalidatePath('/students');
  } catch (error) {
    console.error('Error adding student:', error);
    throw new Error('Failed to add student.');
  }
}
