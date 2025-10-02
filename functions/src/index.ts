import {onCall, HttpsError} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore, FieldValue} from "firebase-admin/firestore";

// Initialize Admin SDK
initializeApp();

// Interface for the user creation request
interface CreateUserRequest {
  email: string;
  password: string;
  displayName: string;
  role: "super_admin" | "manager_admin" | "tutor";
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

/**
 * Cloud Function to create a new tutor account
 * This runs server-side with Admin privileges
 * and doesn't affect the caller's auth session
 */
export const createTutorAccount = onCall(
  async (request) => {
    // Security: Verify the caller is authenticated
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "You must be logged in to create users."
      );
    }

    // Security: Verify the caller is an admin
    const callerUid = request.auth.uid;
    const callerDoc = await getFirestore()
      .collection("users")
      .doc(callerUid)
      .get();

    const callerRole = callerDoc.data()?.role;
    if (callerRole !== "super_admin" && callerRole !== "manager_admin") {
      throw new HttpsError(
        "permission-denied",
        "Only admins can create user accounts."
      );
    }

    const data = request.data as CreateUserRequest;

    try {
      // Create the Firebase Auth user
      const userRecord = await getAuth().createUser({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
      });

      // Create the user document in Firestore
      await getFirestore()
        .collection("users")
        .doc(userRecord.uid)
        .set({
          uid: userRecord.uid,
          email: data.email,
          displayName: data.displayName,
          role: data.role,
          createdBy: data.createdBy,
          createdDate: FieldValue.serverTimestamp(),
          isActive: true,
          ...data.profileData,
        });

      return {
        success: true,
        uid: userRecord.uid,
        message: "User created successfully",
      };
    } catch (error) {
      console.error("Error creating user:", error);

      // Provide helpful error messages
      if ((error as Error & {code?: string}).code ===
      "auth/email-already-exists") {
        throw new HttpsError(
          "already-exists",
          "A user with this email already exists."
        );
      }

      throw new HttpsError(
        "internal",
        "Failed to create user account."
      );
    }
  }
);
