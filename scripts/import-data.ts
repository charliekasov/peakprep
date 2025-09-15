/**
 * @fileoverview A script to import data from a Google Sheet into Firestore.
 *
 * This script connects to the Google Sheets API, reads data from specified
 * sheets, and uploads it to the corresponding Firestore collections. It uses
 * a service account for authentication.
 *
 * ==============================================================================
 *  TROUBLESHOOTING & SETUP
 * ==============================================================================
 *
 * If you see an error like "GaxiosError: The caller does not have permission",
 * please complete the following TWO steps:
 *
 * STEP 1: Enable the Google Sheets API for your project.
 * -----------------------------------------------------------
 *    a. Go to the Google Cloud Console: https://console.cloud.google.com
 *    b. Make sure you have selected the correct project (tutorflow-ivaba).
 *    c. In the search bar at the top, type "Google Sheets API" and select it.
 *    d. Click the "Enable" button. If it's already enabled, you're all set.
 *
 *
 * STEP 2: Share your Google Sheet with the Service Account.
 * -----------------------------------------------------------
 *    a. Open your Google Sheet.
 *    b. Click the "Share" button in the top right corner.
 *    c. Copy the email address from your service-account-key.json file
 *       (the "client_email" field) and paste it into the "Add people and groups" field.
 *    d. Ensure it has at least "Viewer" access, then click "Share".
 *
 *
 * STEP 3: Configure your .env file.
 * -----------------------------------------------------------
 *    a. Update the SPREADSHEET_ID in your .env file with your Google Sheet's ID from the URL.
 *    b. Update the SHEET_NAMES to match the exact names of your sheet tabs.
 *
 *
 * STEP 4: Run the script from your terminal.
 * -----------------------------------------------------------
 *    npm run import-data
 *
 * ==============================================================================
 */
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import { google } from 'googleapis';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// --- Configuration ---
// The ID of your Google Sheet (from the URL)
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

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
function processRecord(item: any, collectionName: string) {
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

    // --- New Score Processing Logic ---
    if (collectionName === 'submissions') {
        const scoreFields: { [key: string]: string } = {
            'Math Score': 'Math',
            'Reading and Writing Score': 'Reading + Writing',
            'Verbal Score': 'Verbal',
            'Quantitative Score': 'Quantitative',
            'Reading Score': 'Reading'
        };

        const scores: { section: string; score: number }[] = [];

        for (const [sheetHeader, sectionName] of Object.entries(scoreFields)) {
            if (processedItem[sheetHeader]) {
                const scoreValue = Number(processedItem[sheetHeader]);
                if (!isNaN(scoreValue)) {
                    scores.push({ section: sectionName, score: scoreValue });
                    delete processedItem[sheetHeader]; // Remove the old top-level field
                }
            }
        }
        
        if (scores.length > 0) {
          processedItem.scores = scores;
        }
    }
    // --- End New Score Processing Logic ---


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
    
    const processedItem = processRecord(item, collectionName);
    importBatch.set(docRef, processedItem);
  }
  await importBatch.commit();

  console.log(`Successfully imported ${jsonData.length} documents into '${collectionName}'.`);
}

async function main() {
  if (!SPREADSHEET_ID) {
    console.error('ERROR: SPREADSHEET_ID environment variable is not set.');
    console.error('Please add it to your .env file.');
    process.exit(1);
  }
  
  console.log('Starting Firestore data import from Google Sheets...');
  // Note: We are no longer importing assignments or submissions from sheets.
  // This is now handled by the hardcoded assignments-data.ts file and manual entry.
  // We only import students now.
  await importCollectionFromSheet('students', SHEET_NAMES.students);
  await importCollectionFromSheet('assignments', SHEET_NAMES.assignments);
  await importCollectionFromSheet('submissions', SHEET_NAMES.submissions);
  
  console.log('\nData import process finished.');
}

main().catch(console.error);
