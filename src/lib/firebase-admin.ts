
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// This is a helper function to initialize the Firebase Admin SDK.
// It ensures that we only initialize the app once, which is a best practice.
export function getAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!.firestore();
  }

  // To run this locally, you'll need to create a service account key
  // and point to it using the GOOGLE_APPLICATION_CREDENTIALS environment variable.
  // In a deployed environment (like Cloud Run), the credentials are automatically provided.
  admin.initializeApp({
      credential: admin.credential.applicationDefault(),
  });

  return admin.app().firestore();
}

export const adminAuth = () => {
    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
        });
    }
    return admin.auth();
}
