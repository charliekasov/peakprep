/**
 * @fileoverview A script to import data from a Google Sheet into Firestore.
 *
 * This script connects to the Google Sheets API, reads data from specified
 * sheets, and uploads it to the corresponding Firestore collections. It uses
 * a service account for authentication.
 *
 * To use this script:
 * 1.  Enable the Cloud Firestore API and Google Sheets API in your Google Cloud project.
 * 2.  Create a Firebase service account and download the private key JSON file.
 *     (Project Settings -> Service accounts -> Generate new private key).
 * 3.  Place the downloaded JSON key file in the root directory.
 * 4.  Update the .env file with:
 *     GOOGLE_APPLICATION_CREDENTIALS="your-service-account-key.json"
 * 5.  In your Google Sheet, share the sheet with the `client_email` from the
 *     JSON key file (e.g., "firebase-adminsdk-xxxxx@...iam.gserviceaccount.com").
 * 6.  Update the `SPREADSHEET_ID` and `SHEET_NAMES` configuration below.
 * 7.  Run the script from your terminal: `npm run import-data`
 */
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import { google } from 'googleapis';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// --- Configuration ---
// The ID of your Google Sheet (from the URL)
const SPREADSHEET_ID = '1rAS--uHk3MfWTuTr-Z7dsvPlUQVf-pgIUZOREYmtoro'; 

// Mapping from Firestore collection name to the exact name of the sheet tab(s)
// For submissions, you can provide an array of sheet names to merge.
const SHEET_NAMES = {
  students: 'Student Database',
  assignments: 'Assignments List',
  submissions: ['Master Tracker', 'Test Scores'],
};

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

// --- Google Sheets API Logic ---

// Helper to convert sheet data to a structured JSON array
function sheetDataToJSON(header: any[], rows: any[][]) {
  return rows.map((row) => {
    const jsonObj: { [key: string]: any } = {};
    header.forEach((key, index) => {
      // Stop processing if the header key is missing for this column
      if (!key) return;
      jsonObj[key] = row[index] || null; // Use null for empty cells
    });
    return jsonObj;
  });
}

// Helper to process data before Firestore import
function processRecord(item: any) {
    const processedItem = { ...item };
    
    // Convert date strings to Firestore Timestamps if applicable
    if (processedItem.submittedAt) {
      const date = new Date(processedItem.submittedAt);
      if (!isNaN(date.getTime())) {
        processedItem.submittedAt = admin.firestore.Timestamp.fromDate(date);
      } else {
        delete processedItem.submittedAt;
      }
    }
     if (processedItem.dueDate) {
      const date = new Date(processedItem.dueDate);
       if (!isNaN(date.getTime())) {
        processedItem.dueDate = admin.firestore.Timestamp.fromDate(date);
      } else {
        delete processedItem.dueDate;
      }
    }
    // Convert numeric strings to numbers
    if (processedItem.score) {
        const score = Number(processedItem.score);
        if (!isNaN(score)) {
            processedItem.score = score;
        } else {
            delete processedItem.score;
        }
    }
    if (processedItem.Rate) {
        const rate = Number(processedItem.Rate);
        if (!isNaN(rate)) {
            processedItem.Rate = rate;
        } else {
            delete processedItem.Rate;
        }
    }

    return processedItem;
}

// Fetches and parses data from a single sheet
async function getDataFromSheet(sheetName: string, auth: any) {
    const sheets = google.sheets({ version: 'v4', auth });
    try {
        const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: sheetName,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            console.log(`No data found in sheet '${sheetName}'.`);
            return [];
        }
        
        const header = rows[0];
        const dataRows = rows.slice(1);
        const jsonData = sheetDataToJSON(header, dataRows);

        return jsonData;

    } catch (err) {
        console.error(`Error reading from sheet '${sheetName}':`, err);
        console.error("\nPlease ensure the Google Sheets API is enabled and the sheet is shared with the service account email.");
        return [];
    }
}


async function importCollectionFromSheet(collectionName: string, sheetNameOrNames: string | string[]) {
  console.log(`\nImporting data for collection: '${collectionName}'...`);
  
  if (SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID_HERE') {
      console.error("ERROR: Please update the SPREADSHEET_ID in the script.");
      return;
  }
  
  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  let jsonData: any[] = [];
  if (Array.isArray(sheetNameOrNames)) {
      console.log(`Merging data from sheets: ${sheetNameOrNames.join(', ')}`);
      for (const sheetName of sheetNameOrNames) {
          const sheetData = await getDataFromSheet(sheetName, auth);
          jsonData = jsonData.concat(sheetData);
      }
  } else {
      console.log(`Reading from sheet: '${sheetNameOrNames}'`);
      jsonData = await getDataFromSheet(sheetNameOrNames, auth);
  }


  if (jsonData.length === 0) {
    console.log(`No records to import for collection '${collectionName}'.`);
    return;
  }

  console.log(`Found ${jsonData.length} total records to import into '${collectionName}'.`);
  const collectionRef = db.collection(collectionName);
  
  // Clear the existing collection before importing new data
  console.log(`Clearing existing data in '${collectionName}'...`);
  const snapshot = await collectionRef.get();
  const deleteBatch = db.batch();
  snapshot.docs.forEach(doc => {
    deleteBatch.delete(doc.ref);
  });
  await deleteBatch.commit();
  console.log(`Cleared ${snapshot.size} documents.`);

  // Import new data
  const importBatch = db.batch();
  for (const item of jsonData) {
    // Skip empty rows that might have been parsed
    if (Object.keys(item).length === 0) continue;

    let docRef;
    if (item.id) {
        docRef = collectionRef.doc(item.id);
        delete item.id;
    } else {
        docRef = collectionRef.doc();
    }
    
    const processedItem = processRecord(item);
    importBatch.set(docRef, processedItem);
  }
  await importBatch.commit();

  console.log(`Successfully imported ${jsonData.length} documents into '${collectionName}'.`);
}

async function main() {
  console.log('Starting Firestore data import from Google Sheets...');
  for (const [collectionName, sheetName] of Object.entries(SHEET_NAMES)) {
    await importCollectionFromSheet(collectionName, sheetName);
  }
  console.log('\nData import process finished.');
}

main().catch(console.error);
