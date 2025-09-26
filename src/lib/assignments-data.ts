import type { Assignment } from "./types";

function createTests(
  testType:
    | "SAT"
    | "ACT"
    | "Upper Level ISEE"
    | "Middle Level ISEE"
    | "Upper Level SSAT"
    | "Middle Level SSAT",
  source: string,
  count: number,
  start: number = 1,
  namePrefix: string,
): Assignment[] {
  const tests: Assignment[] = [];
  for (let i = start; i < start + count; i++) {
    const testTypeSlug = testType.toLowerCase().replace(/\s+/g, "-");
    const sourceSlug = source.toLowerCase().replace(/\s+/g, "-");
    tests.push({
      id: `${testTypeSlug}-${sourceSlug}-${i}`,
      "Full Assignment Name": `${namePrefix} #${i}`,
      isPracticeTest: true,
      "Test Type": testType,
      Source: source,
      Subject: testType,
      Link: "",
      "Broad Category": "Full Test",
      Difficulty: "Medium",
    });
  }
  return tests;
}

export const practiceTests: Assignment[] = [
  // SAT & PSAT
  ...createTests("SAT", "Bluebook", 7, 4, "Bluebook Test"),
  ...createTests("SAT", "Test Innovators", 12, 1, "Test Innovators SAT"),
  {
    id: "psat-10",
    "Full Assignment Name": "Bluebook PSAT 10",
    isPracticeTest: true,
    "Test Type": "SAT",
    Source: "College Board",
    Subject: "PSAT",
    Link: "",
    "Broad Category": "Full Test",
    Difficulty: "Medium",
  },
  {
    id: "psat-nmsqt",
    "Full Assignment Name": "Bluebook PSAT NMSQT",
    isPracticeTest: true,
    "Test Type": "SAT",
    Source: "Bluebook",
    Subject: "PSAT",
    Link: "",
    "Broad Category": "Full Test",
    Difficulty: "Medium",
  },
  {
    id: "psat-8-9",
    "Full Assignment Name": "Bluebook PSAT 8/9",
    isPracticeTest: true,
    "Test Type": "SAT",
    Source: "Bluebook",
    Subject: "PSAT",
    Link: "",
    "Broad Category": "Full Test",
    Difficulty: "Medium",
  },

  // ACT
  ...createTests(
    "ACT",
    "Test Innovators",
    5,
    1,
    "Test Innovators Enhanced ACT",
  ),
  ...createTests("ACT", "ACT", 2, 1, "ACT"),
  ...createTests(
    "ACT",
    "Official ACT Practice",
    4,
    1,
    "Official ACT Practice Test",
  ),

  // SSAT Middle Level
  ...createTests(
    "Middle Level SSAT",
    "Test Innovators",
    6,
    1,
    "Test Innovators Middle Level Practice Test",
  ),
  ...createTests(
    "Middle Level SSAT",
    "Test Innovators Official",
    3,
    1,
    "Test Innovators Official Middle Level Practice Test",
  ),

  // SSAT Upper Level
  ...createTests(
    "Upper Level SSAT",
    "Test Innovators",
    6,
    1,
    "Test Innovators Upper Level Practice Test",
  ),
  ...createTests(
    "Upper Level SSAT",
    "Test Innovators Official",
    3,
    1,
    "Test Innovators Official Upper Level Practice Test",
  ),

  // ISEE Middle Level
  ...createTests(
    "Middle Level ISEE",
    "Test Innovators",
    6,
    1,
    "Test Innovators Middle Level ISEE",
  ),

  // ISEE Upper Level
  ...createTests(
    "Upper Level ISEE",
    "Test Innovators",
    6,
    1,
    "Test Innovators Upper Level ISEE",
  ),
];
