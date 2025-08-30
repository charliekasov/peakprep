/**
 * @fileoverview A script to import data from CSV files into Firestore.
 * 
 * This script reads CSV files from a 'data' directory, parses them, and uploads
 * the data to the specified Firestore collections. It uses a service account key
 * for authentication.
 * 
 * To use this script:
 * 1.  Enable the Cloud Firestore API in your Google Cloud project.
 * 2.  Create a Firebase service account and download the private key JSON file.
 *     Go to Project Settings -> Service accounts -> Generate new private key.
 * 3.  Place the downloaded JSON key file in the root directory of your project.
 * 4.  Update the .env file with the path to your key file:
 *     GOOGLE_APPLICATION_CREDENTIALS="your-service-account-key.json"
 * 5.  Create a 'data' directory in the root of your project.
 * 6.  Place your CSV files in the 'data' directory, naming them
 *     'students.csv', 'assignments.csv', and 'submissions.csv'.
 * 7.  Ensure the CSV files have headers that match the fields in your data types.
 * 8.  Run the script from your terminal using: `npm run import-data`
 */
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// --- Configuration ---
const DATA_DIR = path.join(process.cwd(), 'data');
const COLLECTIONS_TO_IMPORT = [
  'students',
  'assignments',
  'submissions',
];
const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;

// --- Firebase Initialization ---

if (!SERVICE_ACCOUNT_PATH) {
    console.error('ERROR: GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.');
    console.error('Please point it to your service account key file in your .env file.');
    process.exit(1);
}

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(`ERROR: Service account key file not found at: ${SERVICE_ACCOUNT_PATH}`);
    process.exit(1);
}

try {
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
} catch (error: any) {
  console.error('ERROR: Firebase Admin initialization failed.');
  console.error('Please ensure your service account key file is valid.');
  console.error(error);
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
  for (const item of data as any[]) {
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
        console.warn(`Invalid date format for 'submittedAt' in row: ${JSON.stringify(item)}. Skipping conversion.`);
        delete processedItem.submittedAt;
      }
    }
     if (processedItem.dueDate) {
      const date = new Date(processedItem.dueDate);
       if (!isNaN(date.getTime())) {
        processedItem.dueDate = admin.firestore.Timestamp.fromDate(date);
      } else {
        console.warn(`Invalid date format for 'dueDate' in row: ${JSON.stringify(item)}. Skipping conversion.`);
        delete processedItem.dueDate;
      }
    }
    if (processedItem.score) {
        const score = Number(processedItem.score);
        if (!isNaN(score)) {
            processedItem.score = score;
        } else {
            delete processedItem.score;
        }
    }


    batch.set(docRef, processedItem);
  }
  await batch.commit();

  console.log(`Successfully imported ${data.length} documents into '${collectionName}'.`);

}

async function main() {
  console.log('Starting Firestore data import...');
  for (const collectionName of COLLECTIONS_TO_IMPORT) {
    await importCollection(collectionName);
  }
  console.log('\nData import process finished.');
}

main().catch(console.error);