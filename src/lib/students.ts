"use client";

import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Student, StudentFirestoreData } from "./types";
import type { DocumentSnapshot } from "firebase/firestore";

// Single source of truth for student transformation logic
export function fromFirestore(doc: DocumentSnapshot): Student {
  const data = doc.data() as StudentFirestoreData;

  // Normalize testTypes to always be an array
  const testTypes = Array.isArray(data["Test Types"])
    ? data["Test Types"]
    : data["Test Type"]
      ? [data["Test Type"]]
      : [];

  const student: Student = {
    id: doc.id,

    // Spaced field names (legacy Firestore format)
    "Student Name": data["Student Name"],
    "Student Email": data["Student Email"],
    "Parent Email 1": data["Parent Email 1"],
    "Parent Email 2": data["Parent Email 2"],
    "Test Types": testTypes,
    "Target Score": data["Target Score"],
    Rate: data["Rate"],
    Frequency: data["Frequency"],
    "Start Date": data["Start Date"],
    "Projected End Date": data["Projected End Date"],
    "Upcoming Test Date": data["Upcoming Test Date"],

    // Additional fields
    profile: data.profile,
    timeZone: data.timeZone,
    status: data.status || "active",
    tutorId: data.tutorId, // ← ADD THIS LINE

    // Clean field names (for backwards compatibility and easier access)
    name: data["Student Name"],
    email: data["Student Email"],
    parentEmail1: data["Parent Email 1"],
    parentEmail2: data["Parent Email 2"],
    testTypes: testTypes,
    upcomingTestDate: data["Upcoming Test Date"],
  };

  return student;
}

// Helper to convert clean field names to Firestore format
function toFirestoreFormat(
  student: Partial<Omit<Student, "id" | "status">>,
): Partial<StudentFirestoreData> {
  const firestoreData: Partial<StudentFirestoreData> = {};

  // Only add fields that have values to avoid storing undefined
  if (student.name || student["Student Name"]) {
    firestoreData["Student Name"] = student.name || student["Student Name"]!;
  }
  if (student.email || student["Student Email"]) {
    firestoreData["Student Email"] = student.email || student["Student Email"]!;
  }
  if (student.parentEmail1 || student["Parent Email 1"]) {
    firestoreData["Parent Email 1"] =
      student.parentEmail1 || student["Parent Email 1"];
  }
  if (student.parentEmail2 || student["Parent Email 2"]) {
    firestoreData["Parent Email 2"] =
      student.parentEmail2 || student["Parent Email 2"];
  }
  if (student.testTypes || student["Test Types"]) {
    firestoreData["Test Types"] = student.testTypes || student["Test Types"];
  }
  if (student.upcomingTestDate || student["Upcoming Test Date"]) {
    firestoreData["Upcoming Test Date"] =
      student.upcomingTestDate || student["Upcoming Test Date"];
  }
  if (student.Rate || student["Rate"]) {
    firestoreData["Rate"] = student.Rate || student["Rate"];
  }
  if (student.Frequency || student["Frequency"]) {
    firestoreData["Frequency"] = student.Frequency || student["Frequency"];
  }
  if (student.timeZone) {
    firestoreData["timeZone"] = student.timeZone;
  }
  if (student.profile) {
    firestoreData["profile"] = student.profile;
  }
  if (student.tutorId) {
    // ← ADD THESE LINES
    firestoreData["tutorId"] = student.tutorId;
  }

  return firestoreData;
}

export async function getStudents(): Promise<Student[]> {
  const studentsCollection = collection(db, "students");
  const studentsSnapshot = await getDocs(studentsCollection);
  return studentsSnapshot.docs.map(fromFirestore);
}

export async function getStudentById(id: string): Promise<Student | null> {
  const docRef = doc(db, "students", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return fromFirestore(docSnap);
  }
  return null;
}

export async function getStudentsCount(): Promise<number> {
  const studentsCollection = collection(db, "students");
  const studentsSnapshot = await getDocs(studentsCollection);
  return studentsSnapshot.size;
}

export async function addStudent(
  student: Omit<Student, "id" | "status">,
): Promise<string> {
  const studentsCollection = collection(db, "students");
  const studentForFirestore: Partial<StudentFirestoreData> & {
    status: string;
  } = {
    ...toFirestoreFormat(student),
    status: "active",
  };

  const docRef = await addDoc(studentsCollection, studentForFirestore);
  return docRef.id;
}

export async function updateStudent(
  id: string,
  student: Partial<Omit<Student, "id" | "status">>,
): Promise<void> {
  const studentRef = doc(db, "students", id);
  const studentForFirestore = toFirestoreFormat(student);
  await updateDoc(studentRef, studentForFirestore);
}

export async function archiveStudent(id: string): Promise<void> {
  const studentRef = doc(db, "students", id);
  await updateDoc(studentRef, { status: "archived" });
}

export async function unarchiveStudent(id: string): Promise<void> {
  const studentRef = doc(db, "students", id);
  await updateDoc(studentRef, { status: "active" });
}
