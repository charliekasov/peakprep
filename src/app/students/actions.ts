
'use server';

import { addStudent, updateStudent, archiveStudent, unarchiveStudent } from '@/lib/students';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const studentSchema = z.object({
  'Student Name': z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  'Student Email': z.string().email({ message: 'Please enter a valid email address.' }),
  'Parent Email 1': z.union([z.string().email(), z.literal('')]).optional(),
  'Parent Email 2': z.union([z.string().email(), z.literal('')]).optional(),
  'Test Type': z.string().optional(),
  'Upcoming Test Date': z.string().optional(),
  profile: z.string().optional(),
});


export async function handleAddStudent(data: unknown) {
  const validatedFields = studentSchema.safeParse(data);

  if (!validatedFields.success) {
    console.error('Validation Errors:', validatedFields.error.flatten());
    throw new Error('Invalid student data.');
  }
  
  const studentData = validatedFields.data;

  try {
    if (studentData['Parent Email 1'] === '') delete studentData['Parent Email 1'];
    if (studentData['Parent Email 2'] === '') delete studentData['Parent Email 2'];
    
    // Map to old field names for backwards compatibility if needed, though lib handles it
    const submissionData = {
        name: studentData['Student Name'],
        email: studentData['Student Email'],
        parentEmail1: studentData['Parent Email 1'],
        parentEmail2: studentData['Parent Email 2'],
        testType: studentData['Test Type'],
        upcomingTestDate: studentData['Upcoming Test Date'],
        ...studentData,
    };
    
    await addStudent(submissionData);
    revalidatePath('/students');
    return { success: true, message: 'Student added successfully.' };
  } catch (error) {
    console.error('Error adding student:', error);
    throw new Error('Failed to add student.');
  }
}

export async function handleUpdateStudent(studentId: string, data: unknown) {
  const validatedFields = studentSchema.safeParse(data);

  if (!validatedFields.success) {
    console.error('Validation Errors:', validatedFields.error.flatten());
    throw new Error('Invalid student data for update.');
  }

  const studentData = validatedFields.data;
  
  try {
    if (studentData['Parent Email 1'] === '') delete studentData['Parent Email 1'];
    if (studentData['Parent Email 2'] === '') delete studentData['Parent Email 2'];

    await updateStudent(studentId, studentData);
    revalidatePath('/students');
    return { success: true, message: 'Student updated successfully.' };
  } catch (error) {
    console.error('Error updating student:', error);
    throw new Error('Failed to update student.');
  }
}

export async function handleArchiveStudent(studentId: string) {
    try {
        await archiveStudent(studentId);
        revalidatePath('/students');
        return { success: true, message: 'Student archived.' };
    } catch (error) {
        console.error('Error archiving student:', error);
        throw new Error('Failed to archive student.');
    }
}

export async function handleUnarchiveStudent(studentId: string) {
    try {
        await unarchiveStudent(studentId);
        revalidatePath('/students');
        return { success: true, message: 'Student unarchived.' };
    } catch (error) {
        console.error('Error unarchiving student:', error);
        throw new Error('Failed to unarchive student.');
    }
}
