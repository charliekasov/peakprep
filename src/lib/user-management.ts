// Firebase user management functions
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { signOut, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  User,
  UserRole,
  DEFAULT_TUTOR_ROLE,
  validateUserRole,
} from "@/lib/user-roles";

// Collection name
const USERS_COLLECTION = "users";

// Extended user interface for Firestore (with Timestamps)
interface FirestoreUser
  extends Omit<User, "createdDate" | "startDate" | "profileLastUpdated"> {
  createdDate: Timestamp;
  startDate?: Timestamp;
  profileLastUpdated?: Timestamp;
}

// Create a new tutor account with optional profile fields
export async function createTutorAccount(
  email: string,
  password: string,
  displayName: string,
  role: UserRole = DEFAULT_TUTOR_ROLE,
  createdBy: string,
  profileData?: {
    location?: string;
    phone?: string;
    subjects?: string[];
    bio?: string;
    availability?: string;
    experience?: string;
    education?: string;
    hourlyRate?: string; // Admin can set during creation
    adminNotes?: string; // Admin can add notes
    startDate?: Date; // When they start
  },
): Promise<User> {
  try {
    // 1. Create Firebase Auth account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const firebaseUser = userCredential.user;

    // 2. Send email verification
    await sendEmailVerification(firebaseUser);

    // 3. Create Firestore user record with profile data
    const userData: Omit<FirestoreUser, "uid"> = {
      email: firebaseUser.email!,
      displayName,
      role,
      createdBy,
      createdDate: Timestamp.now(),
      isActive: true,
      profileLastUpdated: Timestamp.now(),
      profileUpdatedBy: createdBy,
    };

    // Add optional fields only if they exist
    if (profileData?.location) userData.location = profileData.location;
    if (profileData?.phone) userData.phone = profileData.phone;
    if (profileData?.subjects) userData.subjects = profileData.subjects;
    if (profileData?.bio) userData.bio = profileData.bio;
    if (profileData?.availability)
      userData.availability = profileData.availability;
    if (profileData?.experience) userData.experience = profileData.experience;
    if (profileData?.education) userData.education = profileData.education;
    if (profileData?.hourlyRate) userData.hourlyRate = profileData.hourlyRate;
    if (profileData?.adminNotes) userData.adminNotes = profileData.adminNotes;
    if (profileData?.startDate)
      userData.startDate = Timestamp.fromDate(profileData.startDate);

    // Add to Firestore with Firebase Auth UID as document ID
    await setDoc(doc(db, USERS_COLLECTION, firebaseUser.uid), userData);

    // Return the complete user object
    return {
      uid: firebaseUser.uid,
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role,
      createdBy: userData.createdBy,
      createdDate: userData.createdDate.toDate(),
      isActive: userData.isActive,

      // Profile fields
      location: userData.location,
      phone: userData.phone,
      subjects: userData.subjects,
      bio: userData.bio,
      availability: userData.availability,
      experience: userData.experience,
      education: userData.education,
      hourlyRate: userData.hourlyRate,
      adminNotes: userData.adminNotes,
      startDate: userData.startDate?.toDate(),

      // Profile metadata
      profileLastUpdated: userData.profileLastUpdated?.toDate(),
      profileUpdatedBy: userData.profileUpdatedBy,
    };
  } catch (error) {
    console.error("Error creating tutor account:", error);
    throw new Error(
      `Failed to create tutor account: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Get user data by Firebase Auth UID
export async function getUserById(uid: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));

    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data() as FirestoreUser;

    return {
      uid: userDoc.id,
      email: userData.email,
      displayName: userData.displayName,
      role: validateUserRole(userData.role),
      createdBy: userData.createdBy,
      createdDate: userData.createdDate.toDate(),
      isActive: userData.isActive,

      // Profile fields
      location: userData.location,
      phone: userData.phone,
      subjects: userData.subjects,
      bio: userData.bio,
      availability: userData.availability,
      experience: userData.experience,
      education: userData.education,
      hourlyRate: userData.hourlyRate,
      adminNotes: userData.adminNotes,
      startDate: userData.startDate?.toDate(),

      // Profile metadata
      profileLastUpdated: userData.profileLastUpdated?.toDate(),
      profileUpdatedBy: userData.profileUpdatedBy,
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    throw new Error(
      `Failed to fetch user: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Get user data by email
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where("email", "==", email),
      where("isActive", "==", true),
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    // Should only be one user per email
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data() as FirestoreUser;

    return {
      uid: userDoc.id,
      email: userData.email,
      displayName: userData.displayName,
      role: validateUserRole(userData.role),
      createdBy: userData.createdBy,
      createdDate: userData.createdDate.toDate(),
      isActive: userData.isActive,

      // Profile fields
      location: userData.location,
      phone: userData.phone,
      subjects: userData.subjects,
      bio: userData.bio,
      availability: userData.availability,
      experience: userData.experience,
      education: userData.education,
      hourlyRate: userData.hourlyRate,
      adminNotes: userData.adminNotes,
      startDate: userData.startDate?.toDate(),

      // Profile metadata
      profileLastUpdated: userData.profileLastUpdated?.toDate(),
      profileUpdatedBy: userData.profileUpdatedBy,
    };
  } catch (error) {
    console.error("Error fetching user by email:", error);
    throw new Error(
      `Failed to fetch user by email: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Get all tutors (for admin management)
export async function getAllTutors(): Promise<User[]> {
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where("isActive", "==", true),
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs
      .map((doc) => {
        const userData = doc.data() as FirestoreUser;
        return {
          uid: doc.id,
          email: userData.email,
          displayName: userData.displayName,
          role: validateUserRole(userData.role),
          createdBy: userData.createdBy,
          createdDate: userData.createdDate.toDate(),
          isActive: userData.isActive,

          // Profile fields
          location: userData.location,
          phone: userData.phone,
          subjects: userData.subjects,
          bio: userData.bio,
          availability: userData.availability,
          experience: userData.experience,
          education: userData.education,
          hourlyRate: userData.hourlyRate,
          adminNotes: userData.adminNotes,
          startDate: userData.startDate?.toDate(),

          // Profile metadata
          profileLastUpdated: userData.profileLastUpdated?.toDate(),
          profileUpdatedBy: userData.profileUpdatedBy,
        };
      })
      .sort((a, b) => b.createdDate.getTime() - a.createdDate.getTime());
  } catch (error) {
    console.error("Error fetching all tutors:", error);
    throw new Error(
      `Failed to fetch tutors: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Update user role (admin function)
export async function updateUserRole(
  uid: string,
  newRole: UserRole,
): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
      role: newRole,
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    throw new Error(
      `Failed to update user role: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Update user profile (role-based field restrictions handled by UI)
export async function updateUserProfile(
  uid: string,
  profileUpdates: Partial<{
    displayName: string;
    location: string;
    phone: string;
    subjects: string[];
    bio: string;
    availability: string;
    experience: string;
    education: string;
    hourlyRate: string; // Admin-only
    adminNotes: string; // Admin-only
    startDate: Date; // Admin-only
  }>,
  updatedBy: string,
): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);

    // Convert Date to Timestamp if provided
    const firestoreUpdates: any = { ...profileUpdates };
    if (profileUpdates.startDate) {
      firestoreUpdates.startDate = Timestamp.fromDate(profileUpdates.startDate);
    }

    // Remove undefined and empty string values
    Object.keys(firestoreUpdates).forEach(key => {
      if (firestoreUpdates[key] === undefined || firestoreUpdates[key] === '') {
        delete firestoreUpdates[key];
      }
    });

    // Add metadata
    firestoreUpdates.profileLastUpdated = Timestamp.now();
    firestoreUpdates.profileUpdatedBy = updatedBy;

    await updateDoc(userRef, firestoreUpdates);
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw new Error(
      `Failed to update user profile: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Archive user (soft delete)
export async function archiveUser(uid: string): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
      isActive: false,
    });
  } catch (error) {
    console.error("Error archiving user:", error);
    throw new Error(
      `Failed to archive user: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Reactivate user
export async function reactivateUser(uid: string): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
      isActive: true,
    });
  } catch (error) {
    console.error("Error reactivating user:", error);
    throw new Error(
      `Failed to reactivate user: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Check if user exists in our system (for new Firebase Auth users)
export async function isUserInSystem(uid: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
    return userDoc.exists() && userDoc.data()?.isActive === true;
  } catch (error) {
    console.error("Error checking if user exists:", error);
    return false;
  }
}

// Create initial super admin (run once during setup)
export async function createInitialSuperAdmin(
  uid: string,
  email: string,
  displayName: string,
): Promise<User> {
  try {
    const userData: Omit<FirestoreUser, "uid"> = {
      email,
      displayName,
      role: "super_admin",
      createdBy: uid, // Self-created
      createdDate: Timestamp.now(),
      isActive: true,

      // Initialize with basic profile
      profileLastUpdated: Timestamp.now(),
      profileUpdatedBy: uid,
    };

    await setDoc(doc(db, USERS_COLLECTION, uid), userData);

    return {
      uid,
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role,
      createdBy: userData.createdBy,
      createdDate: userData.createdDate.toDate(),
      isActive: userData.isActive,
      profileLastUpdated: userData.profileLastUpdated?.toDate(),
      profileUpdatedBy: userData.profileUpdatedBy,
    };
  } catch (error) {
    console.error("Error creating initial super admin:", error);
    throw new Error(
      `Failed to create initial super admin: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Helper to get current user's full profile
export async function getCurrentUserProfile(uid: string): Promise<User | null> {
  return getUserById(uid);
}

// Type guard for user existence
export function isUser(data: unknown): data is User {
  return (
    typeof data === "object" &&
    data !== null &&
    "uid" in data &&
    "email" in data &&
    "role" in data &&
    "isActive" in data
  );
}
