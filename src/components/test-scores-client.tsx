"use client";

import { useState, useMemo, useEffect, Fragment } from "react";
import type { Student, Assignment, Submission } from "@/lib/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Line,
  LineChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { AddOfficialScoreDialog } from "./add-official-score-dialog";
import { EditScoreDialog } from "./edit-score-dialog";
import { MoreHorizontal, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { handleDeleteTestScore } from "@/app/test-scores/actions";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TestScoresClientProps {
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
}

const sourceColors: { [key: string]: string } = {
  Official: "#16a34a", // green-600
  Bluebook: "#3b82f6", // blue-500
  "Test Innovators": "#60a5fa", // blue-400
  "Test Innovators Official Upper Level": "#93c5fd", // blue-300
  "Official PSAT": "#a7f3d0", // green-200
  "College Board": "#6ee7b7", // green-300
  "Official SAT": "#34d399", // green-400
  ACT: "#f9a8d4", // pink-300
  "Official ACT Practice": "#f472b6", // pink-400,
  "Official ACT": "#f472b6",
  "Test Innovators Enhanced ACT": "#f9a8d4",
  "Test Innovators Middle Level Practice Test": "#a5b4fc",
  "Test Innovators Official Middle Level": "#a5b4fc", // indigo-300
  "Test Innovators Official": "#818cf8", // indigo-400,
  Tutorverse: "#c4b5fd", // violet-300
};

const sectionColors: { [key: string]: string } = {
  "Reading + Writing": "#8884d8",
  Math: "#82ca9d",
  "Verbal Reasoning": "#ffc658",
  "Quantitative Reasoning": "#ff8042",
  "Reading Comprehension": "#0088FE",
  English: "#8884d8",
  Reading: "#82ca9d",
  Science: "#ffc658",
  Verbal: "#ff8042",
  Quantitative: "#0088FE",
  "Math Achievement": "#ff7300",
};

const TEST_CONFIG: any = {
  SAT: {
    sections: [
      { name: "Reading + Writing", min: 200, max: 800, step: 10, default: 600 },
      { name: "Math", min: 200, max: 800, step: 10, default: 600 },
    ],
  },
  "PSAT/NMSQT": {
    sections: [
      {
        name: "Reading and Writing",
        min: 200,
        max: 800,
        step: 10,
        default: 500,
      },
      { name: "Math", min: 200, max: 800, step: 10, default: 500 },
    ],
  },
  "PSAT 10": {
    sections: [
      {
        name: "Reading and Writing",
        min: 200,
        max: 800,
        step: 10,
        default: 500,
      },
      { name: "Math", min: 200, max: 800, step: 10, default: 500 },
    ],
  },
  "PSAT 8/9": {
    sections: [
      {
        name: "Reading and Writing",
        min: 200,
        max: 800,
        step: 10,
        default: 450,
      },
      { name: "Math", min: 200, max: 800, step: 10, default: 450 },
    ],
  },
  ACT: {
    sections: [
      { name: "English", min: 1, max: 36, step: 1, default: 27 },
      { name: "Math", min: 1, max: 36, step: 1, default: 27 },
      { name: "Reading", min: 1, max: 36, step: 1, default: 27 },
      { name: "Science", min: 1, max: 36, step: 1, default: 27 },
    ],
  },
  "Upper Level SSAT": {
    sections: [
      { name: "Verbal", min: 1, max: 99, step: 1, default: 65 },
      { name: "Reading", min: 1, max: 99, step: 1, default: 65 },
      { name: "Quantitative", min: 1, max: 99, step: 1, default: 65 },
    ],
  },
  "Middle Level SSAT": {
    sections: [
      { name: "Verbal", min: 1, max: 99, step: 1, default: 65 },
      { name: "Reading", min: 1, max: 99, step: 1, default: 65 },
      { name: "Quantitative", min: 1, max: 99, step: 1, default: 65 },
    ],
  },
  "Upper Level ISEE": {
    sections: [
      { name: "Verbal Reasoning", min: 1, max: 99, step: 1, default: 65 },
      { name: "Quantitative Reasoning", min: 1, max: 99, step: 1, default: 65 },
      { name: "Reading Comprehension", min: 1, max: 99, step: 1, default: 65 },
      { name: "Math Achievement", min: 1, max: 99, step: 1, default: 65 },
    ],
  },
  "Middle Level ISEE": {
    sections: [
      { name: "Verbal Reasoning", min: 1, max: 99, step: 1, default: 65 },
      { name: "Quantitative Reasoning", min: 1, max: 99, step: 1, default: 65 },
      { name: "Reading Comprehension", min: 1, max: 99, step: 1, default: 65 },
      { name: "Math Achievement", min: 1, max: 99, step: 1, default: 65 },
    ],
  },
};

const getStanine = (percentile: number) => {
  if (percentile >= 96) return 9;
  if (percentile >= 89) return 8;
  if (percentile >= 77) return 7;
  if (percentile >= 60) return 6;
  if (percentile >= 40) return 5;
  if (percentile >= 23) return 4;
  if (percentile >= 11) return 3;
  if (percentile >= 4) return 2;
  return 1;
};

// New Component for a single test type's display
function TestTypeDisplay({
  testType,
  student,
  submissions,
  assignments,
  onEdit,
  onDelete,
}: {
  testType: string;
  student: Student;
  submissions: (Submission & { assignment?: Assignment })[];
  assignments: Assignment[];
  onEdit: (submission: Submission) => void;
  onDelete: (submission: Submission) => void;
}) {
  const assignmentMap = useMemo(
    () => new Map(assignments.map((a) => [a.id, a])),
    [assignments],
  );

  const relevantSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const assignment = s.assignment || assignmentMap.get(s.assignmentId);

      // Handle practice tests
      if (assignment?.["Test Type"] === testType) {
        return true;
      }

      // Handle official tests
      if (s.isOfficial && s.officialTestName?.includes(testType)) {
        return true;
      }

      return false;
    });
  }, [submissions, testType, assignmentMap]);

  const availableSources = useMemo(() => {
    const sources = new Set<string>();
    relevantSubmissions.forEach((sub) => {
      if (sub.isOfficial) {
        sources.add("Official");
      } else if (sub.assignment?.Source) {
        sources.add(sub.assignment.Source);
      }
    });
    return Array.from(sources);
  }, [relevantSubmissions]);

  const [selectedSources, setSelectedSources] = useState<Set<string>>(
    new Set(availableSources),
  );

  useEffect(() => {
    setSelectedSources(new Set(availableSources));
  }, [availableSources]);

  const filteredSubmissions = useMemo(() => {
    return relevantSubmissions
      .filter((s) => {
        if (s.isOfficial) return selectedSources.has("Official");
        if (!s.assignment || !s.assignment.Source) return false;
        return selectedSources.has(s.assignment.Source);
      })
      .sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime());
  }, [relevantSubmissions, selectedSources]);

  const chartData = useMemo(() => {
    return filteredSubmissions.map((s) => {
      const assignment = s.assignment || assignmentMap.get(s.assignmentId);
      const dataPoint: { [key: string]: any } = {
        name: s.isOfficial
          ? s.officialTestName
          : assignment?.["Full Assignment Name"] || "Unknown Test",
        date: s.submittedAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        source: s.isOfficial ? "Official" : assignment?.Source,
        testType: assignment?.["Test Type"],
      };
      s.scores?.forEach((score) => {
        dataPoint[score.section] = score.score;
      });
      return dataPoint;
    });
  }, [filteredSubmissions, assignmentMap]);

  const allSections = useMemo(() => {
    return TEST_CONFIG[testType]?.sections.map((sec: any) => sec.name) || [];
  }, [testType]);

  const yAxisDomain = useMemo(() => {
    if (testType === "SAT") return [200, 800];
    if (testType === "ACT") return [1, 36];
    if (testType?.includes("SSAT") || testType?.includes("ISEE"))
      return [1, 99];
    return ["auto", "auto"]; // Default domain
  }, [testType]);

  const handleSourceToggle = (source: string) => {
    setSelectedSources((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(source)) {
        newSet.delete(source);
      } else {
        newSet.add(source);
      }
      return newSet;
    });
  };

  if (relevantSubmissions.length === 0) {
    return null; // Don't render this component if there are no scores for this test type
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{testType} Scores</CardTitle>
        <CardDescription>
          Practice and official test scores over time. Use the checkboxes to
          filter by test source.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center gap-2 lg:gap-x-4 lg:gap-y-2">
          {availableSources.map((source) => (
            <div key={source} className="flex items-center space-x-2">
              <Checkbox
                id={`source-${testType}-${source}`}
                checked={selectedSources.has(source)}
                onCheckedChange={() => handleSourceToggle(source)}
                style={{
                  backgroundColor: selectedSources.has(source)
                    ? sourceColors[source]
                    : undefined,
                  borderColor: sourceColors[source],
                }}
              />
              <Label htmlFor={`source-${testType}-${source}`}>{source}</Label>
            </div>
          ))}
        </div>

        <div className="h-64 md:h-96 w-full overflow-hidden">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis type="number" domain={yAxisDomain} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    borderColor: "hsl(var(--border))",
                  }}
                  formatter={(value: number, name: string, props) => {
                    const isStanineTest =
                      props.payload.testType?.includes("ISEE");
                    if (isStanineTest) {
                      return `${value} (Stanine: ${getStanine(value)})`;
                    }
                    return value;
                  }}
                  labelFormatter={(label) => label}
                />
                <Legend />
                {allSections.map((section: string) => (
                  <Line
                    key={section}
                    type="monotone"
                    dataKey={section}
                    stroke={sectionColors[section] || "#8884d8"}
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed text-muted-foreground">
              <p>No {testType} scores to display for the selected sources.</p>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{testType} Scores Log</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mobile: Card layout */}
            <div className="block md:hidden space-y-4">
              {[...filteredSubmissions].reverse().map((submission) => {
                const assignment =
                  submission.assignment ||
                  assignmentMap.get(submission.assignmentId);
                const isStanineTest = testType?.includes("ISEE");
                return (
                  <Card key={submission.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-sm">
                            {submission.isOfficial
                              ? submission.officialTestName
                              : assignment?.["Full Assignment Name"] ||
                                "Unknown Assignment"}
                          </h3>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => onEdit(submission)}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => onDelete(submission)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="font-medium">Source:</span>{" "}
                            {submission.isOfficial
                              ? "Official"
                              : assignment?.Source || "N/A"}
                          </p>
                          <p>
                            <span className="font-medium">Date:</span>{" "}
                            {submission.submittedAt.toLocaleDateString()}
                          </p>
                          <div>
                            <span className="font-medium">Scores:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {submission.scores?.map((s, index) => (
                                <span
                                  key={index}
                                  className="text-xs bg-muted px-2 py-1 rounded"
                                >
                                  {s.section}: {s.score}
                                  {isStanineTest
                                    ? ` (${getStanine(s.score)})`
                                    : ""}
                                </span>
                              )) || (
                                <span className="text-xs text-muted-foreground">
                                  No scores recorded
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Desktop: Original Table layout */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Scores</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...filteredSubmissions].reverse().map((submission) => {
                    const assignment =
                      submission.assignment ||
                      assignmentMap.get(submission.assignmentId);
                    const isStanineTest = testType?.includes("ISEE");
                    return (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">
                          {submission.isOfficial
                            ? submission.officialTestName
                            : assignment?.["Full Assignment Name"] ||
                              "Unknown Assignment"}
                        </TableCell>
                        <TableCell>
                          {submission.isOfficial
                            ? "Official"
                            : assignment?.Source || "N/A"}
                        </TableCell>
                        <TableCell>
                          {submission.submittedAt.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {submission.scores
                            ?.map(
                              (s) =>
                                `${s.section}: ${s.score}${isStanineTest ? ` (Stanine: ${getStanine(s.score)})` : ""}`,
                            )
                            .join(", ")}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => onEdit(submission)}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => onDelete(submission)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

export function TestScoresClient({
  students,
  assignments,
  submissions,
}: TestScoresClientProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );
  const [isMounted, setIsMounted] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(
    null,
  );
  const [deletingSubmission, setDeletingSubmission] =
    useState<Submission | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleScoreUpdate = () => {
    router.refresh();
    setEditingSubmission(null);
  };

  const handleScoreAdd = () => {
    router.refresh();
  };

  const handleScoreDelete = async () => {
    if (!deletingSubmission) return;
    setIsDeleting(true);
    try {
      await handleDeleteTestScore({ submissionId: deletingSubmission.id });
      toast({
        title: "Success",
        description: "Test score deleted successfully.",
      });
      setDeletingSubmission(null);
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete score.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const activeStudents = useMemo(
    () => students.filter((s) => (s.status || "active") === "active"),
    [students],
  );

  useEffect(() => {
    setIsMounted(true);
    if (activeStudents.length > 0 && !selectedStudentId) {
      setSelectedStudentId(activeStudents[0].id);
    }
  }, [activeStudents, selectedStudentId]);

  const studentMap = useMemo(
    () => new Map(students.map((s) => [s.id, s])),
    [students],
  );
  const assignmentMap = useMemo(
    () => new Map(assignments.map((a) => [a.id, a])),
    [assignments],
  );
  const selectedStudent = useMemo(
    () => studentMap.get(selectedStudentId || ""),
    [selectedStudentId, studentMap],
  );

  const studentTestTypes = useMemo(
    () => selectedStudent?.["Test Types"] || [],
    [selectedStudent],
  );

  const studentSubmissions = useMemo(() => {
    if (!selectedStudentId) return [];
    return submissions
      .filter((s) => {
        const assignment = assignmentMap.get(s.assignmentId);
        return (
          s.studentId === selectedStudentId &&
          (assignment?.isPracticeTest || s.isOfficial) &&
          s.status === "Completed" &&
          s.scores &&
          s.scores.length > 0
        );
      })
      .map((s) => ({
        ...s,
        assignment: assignmentMap.get(s.assignmentId),
      }));
  }, [selectedStudentId, submissions, assignmentMap]);

  if (!isMounted) {
    return null; // or a loading skeleton
  }

  const renderContent = () => {
    if (!selectedStudent) {
      return (
        <Card>
          <CardContent className="flex h-96 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
            <p>Select a student to view their test scores.</p>
          </CardContent>
        </Card>
      );
    }

    if (studentTestTypes.length === 0) {
      return (
        <Card>
          <CardContent className="flex h-96 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
            <p>
              {selectedStudent.name} is not currently preparing for any tests.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (studentTestTypes.length === 1) {
      return (
        <TestTypeDisplay
          testType={studentTestTypes[0]}
          student={selectedStudent}
          submissions={studentSubmissions}
          assignments={assignments}
          onEdit={setEditingSubmission}
          onDelete={setDeletingSubmission}
        />
      );
    }

    return (
      <Tabs defaultValue={studentTestTypes[0]} className="w-full">
        <div className="mb-4">
          <TabsList>
            {studentTestTypes.map((tt) => (
              <TabsTrigger key={tt} value={tt}>
                {tt}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {studentTestTypes.map((tt) => (
          <TabsContent key={tt} value={tt}>
            <TestTypeDisplay
              testType={tt}
              student={selectedStudent!}
              submissions={studentSubmissions}
              assignments={assignments}
              onEdit={setEditingSubmission}
              onDelete={setDeletingSubmission}
            />
          </TabsContent>
        ))}
      </Tabs>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Test Scores
        </h1>
        <div className="flex items-center gap-2">
          <div className="w-full sm:w-64">
            <Select
              onValueChange={setSelectedStudentId}
              value={selectedStudentId || ""}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a student..." />
              </SelectTrigger>
              <SelectContent>
                {activeStudents.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AddOfficialScoreDialog
            students={activeStudents}
            assignments={assignments}
            onScoreAdd={handleScoreAdd}
          />
        </div>
      </div>

      {renderContent()}

      {/* Edit Dialog */}
      {editingSubmission && selectedStudent && (
        <EditScoreDialog
          submission={editingSubmission}
          student={selectedStudent}
          isOpen={!!editingSubmission}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setEditingSubmission(null);
            }
          }}
          onScoreUpdate={handleScoreUpdate}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingSubmission}
        onOpenChange={(isOpen) => !isOpen && setDeletingSubmission(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              test score entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingSubmission(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleScoreDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
