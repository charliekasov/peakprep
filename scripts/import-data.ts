/**
 * @fileoverview A script to import data from CSV files into Firestore.
 * 
 * This script reads CSV files from a 'data' directory, parses them, and uploads
 * the data to the specified Firestore collections. It uses service account
 * credentials for authentication, which is the recommended approach for
 * server-side scripts.
 * 
 * To use this script:
 * 1.  Set up a service account in your Firebase project and download the
 *     JSON key file.
 * 2.  Create a '.env' file in the root of the project and add the following line:
 *     GOOGLE_APPLICATION_CREDENTIALS="path/to/your/service-account-key.json"
 * 3.  Create a 'data' directory in the root of your project.
 * 4.  Place your CSV files in the 'data' directory, naming them
 *     'students.csv', 'assignments.csv', and 'submissions.csv'.
 * 5.  Ensure the CSV files have headers that match the fields in your data types.
 * 6.  Run the script from your terminal using: `npm run import-data`
 */
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// --- Configuration ---
const
  DATA_DIR = path.join(process.cwd(), 'data');
const COLLECTIONS_TO_IMPORT = [
  'students',
  'assignments',
  'submissions',
];

// --- Firebase Initialization ---

// Check if the service account key path is set
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(
    'ERROR: GOOGLE_APPLICATION_CREDENTIALS environment variable not set.'
  );
  console.error(
    'Please create a service account and set the path to the key file in your .env file.'
  );
  process.exit(1);
}

// Check if the service account key file exists
if (!fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    console.error(`ERROR: Service account key file not found at path: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
    console.error('Please ensure the path in your .env file is correct.');
    process.exit(1);
}


try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
} catch (error: any) {
  console.error('ERROR: Firebase Admin initialization failed.');
  if (error.code === 'invalid-credential') {
    console.error('The service account credentials are not valid. Please check the JSON key file.');
  } else {
    console.error(error);
  }
  process.exit(1);
}


const db = admin.firestore();

// --- Main Import Logic ---

async function importCollection(collectionName: string) {
  const filePath = path.join(DATA_DIR, `${collectionName}.csv`);
  if (!fs.existsSync(filePath)) {
    console.warn(`Skipping: File not found for collection '${collectionName}' at ${filePath}`);
    return;
  }

  console.log(`\nImporting data for collection: '${collectionName}'...`);

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data, errors, meta } = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (errors.length > 0) {
    console.error(`Errors parsing ${collectionName}.csv:`, errors);
    return;
  }

  if (data.length === 0) {
    console.log(`No data found in ${collectionName}.csv.`);
    return;
  }

  console.log(`Found ${data.length} records to import.`);
  const collectionRef = db.collection(collectionName);
  const batch = db.batch();

  data.forEach((item: any, index) => {
    // Firestore needs string IDs for documents. If an ID is provided in the CSV, use it.
    // Otherwise, let Firestore generate a unique ID.
    let docRef;
    if (item.id) {
        docRef = collectionRef.doc(item.id);
        delete item.id; // Don't store the id field inside the document itself
    } else {
        docRef = collectionRef.doc();
    }
    
    // Convert date strings to Firestore Timestamps if applicable
    const processedItem = { ...item };
    if (processedItem.submittedAt) {
      const date = new Date(processedItem.submittedAt);
      if (!isNaN(date.getTime())) {
        processedItem.submittedAt = admin.firestore.Timestamp.fromDate(date);
      } else {
        console.warn(`Invalid date format for 'submittedAt' in row ${index + 1}: ${processedItem.submittedAt}. Skipping conversion.`);
      }
    }
     if (processedItem.dueDate) {
      const date = new Date(processedItem.dueDate);
       if (!isNaN(date.getTime())) {
        processedItem.dueDate = admin.firestore.Timestamp.fromDate(date);
      } else {
        console.warn(`Invalid date format for 'dueDate' in row ${index + 1}: ${processedItem.dueDate}. Skipping conversion.`);
      }
    }


    batch.set(docRef, processedItem);
  });

  try {
    await batch.commit();
    console.log(`Successfully imported ${data.length} documents into '${collectionName}'.`);
  } catch (error) {
    console.error(`Error committing batch for '${collectionName}':`, error);
  }
}

async function main() {
  console.log('Starting Firestore data import...');
  for (const collectionName of COLLECTIONS_TO_IMPORT) {
    await importCollection(collectionName);
  }
  console.log('\nData import process finished.');
}

main().catch(console.error);