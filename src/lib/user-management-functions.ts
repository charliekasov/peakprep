import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import type { UserRole } from './user-roles';

interface CreateTutorData {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  createdBy: string;
  profileData?: {
    location?: string;
    phone?: string;
    subjects?: string[];
    bio?: string;
    availability?: string;
    experience?: string;
    education?: string;
    hourlyRate?: string;
    adminNotes?: string;
    startDate?: Date;
  };
}

export async function createTutorWithFunction(data: CreateTutorData) {
  const createTutor = httpsCallable(functions, 'createTutorAccount');
  
  try {
    const result = await createTutor(data);
    return result.data;
  } catch (error: any) {
    console.error('Error calling createTutorAccount function:', error);
    throw new Error(error.message || 'Failed to create tutor account');
  }
}