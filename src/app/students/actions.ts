
'use server';

import { revalidatePath } from 'next/cache';
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Student } from '@/lib/types';


export async function addStudentAction(student: Omit<Student, 'id' | 'status'>): Promise<{success: boolean, message: string}> {
  try {
    const studentsCollection = collection(db, 'students');
    await addDoc(studentsCollection, {
      ...student,
      status: 'active'
    });
    revalidatePath('/students');
    return { success: true, message: 'Student added successfully.' };
  } catch (error: any) {
    console.error('Error adding student:', error);
    return { success: false, message: 'Failed to add student.' };
  }
}

export async function updateStudentAction(id: string, student: Partial<Omit<Student, 'id' | 'status'>>): Promise<{success: boolean, message: string}> {
  try {
    const studentRef = doc(db, 'students', id);
    await updateDoc(studentRef, student);
    revalidatePath('/students');
    revalidatePath(`/students/${id}`); // Assuming a detail page might exist
    return { success: true, message: 'Student updated successfully.' };
  } catch (error: any) {
    console.error('Error updating student:', error);
    return { success: false, message: 'Failed to update student.' };
  }
}

export async function archiveStudentAction(id: string): Promise<{success: boolean, message: string}> {
    try {
        const studentRef = doc(db, 'students', id);
        await updateDoc(studentRef, { status: 'archived' });
        revalidatePath('/students');
        return { success: true, message: 'Student archived.' };
    } catch (error: any) {
        console.error('Error archiving student:', error);
        return { success: false, message: 'Failed to archive student.' };
    }
}

export async function unarchiveStudentAction(id: string): Promise<{success: boolean, message: string}> {
    try {
        const studentRef = doc(db, 'students', id);
        await updateDoc(studentRef, { status: 'active' });
        revalidatePath('/students');
        return { success: true, message: 'Student unarchived.' };
    } catch (error: any) {
        console.error('Error unarchiving student:', error);
        return { success: false, message: 'Failed to unarchive student.' };
    }
}
