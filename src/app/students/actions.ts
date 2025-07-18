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
  parentEmail: z.string().email({ message: 'Please enter a valid email.' }).optional().or(z.literal('')),
  profile: z.string().min(10, {
    message: 'Profile must be at least 10 characters.',
  }),
});

export async function handleAddStudent(data: z.infer<typeof studentSchema>) {
  const validatedFields = studentSchema.safeParse(data);

  if (!validatedFields.success) {
    throw new Error('Invalid student data.');
  }
  
  try {
    await addStudent(validatedFields.data);
    revalidatePath('/students');
  } catch (error) {
    console.error('Error adding student:', error);
    throw new Error('Failed to add student.');
  }
}
