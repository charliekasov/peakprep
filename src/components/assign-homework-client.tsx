"use client";

import { useState, useMemo, useEffect } from "react";
import type { Student, Assignment, Submission } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Loader2, ArrowLeft, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/use-user-role";
import { getStudentById } from "@/lib/students";
import { sendHomeworkEmail } from "@/app/assign-homework/email-action";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface AssignHomeworkClientProps {
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
}

interface AssignmentOptions {
  sections?: string[];
  timing?: "timed" | "untimed";
}

const SECTIONS_BY_TEST_TYPE: Record<string, string[]> = {
  SAT: ["Reading + Writing", "Math"],
  ACT: ["English", "Math", "Reading", "Science"],
  "Upper Level SSAT": [
    "Verbal Reasoning",
    "Quantitative 1",
    "Reading Comprehension",
    "Quantitative 2",
  ],
  "Middle Level SSAT": [
    "Verbal Reasoning",
    "Quantitative 1",
    "Reading Comprehension",
    "Quantitative 2",
  ],
  "Upper Level ISEE": [
    "Verbal",
    "Quantitative Reasoning",
    "Reading Comprehension",
    "Math Achievement",
  ],
  "Middle Level ISEE": [
    "Verbal",
    "Quantitative Reasoning",
    "Reading Comprehension",
    "Math Achievement",
  ],
};

export function AssignHomeworkClient({
  students,
  assignments,
  submissions,
}: AssignHomeworkClientProps) {
  const [view, setView] = useState<"assignments" | "email">("assignments");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );
  const [selectedAssignments, setSelectedAssignments] = useState<
    Map<string, AssignmentOptions>
  >(new Map());
  const [worksheetSearchQuery, setWorksheetSearchQuery] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ccParents, setCcParents] = useState(false);
  const { toast } = useToast();
  const { user } = useUserRole();

  const [configuringAssignment, setConfiguringAssignment] =
    useState<Assignment | null>(null);
  const [tempOptions, setTempOptions] = useState<AssignmentOptions>({});
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);

  const activeStudents = useMemo(
    () => students.filter((s) => (s.status || "active") === "active"),
    [students],
  );

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || null,
    [selectedStudentId, students],
  );

  const worksheetSources = useMemo(() => {
    const sources = new Set<string>();
    const studentTestTypes = selectedStudent?.["Test Types"] || [];
    assignments
      .filter((a) => !a["isPracticeTest"] && !a["isOfficialTest"])
      .forEach((a) => {
        if (
          a["Source"] &&
          studentTestTypes.some((stt) => stt === a["Test Type"])
        ) {
          const sourceName =
            a["Source"] === "Google Drive" ? "Question Bank" : a["Source"];
          sources.add(sourceName);
        }
      });
    return Array.from(sources);
  }, [selectedStudent, assignments]);

  // Filter to only show students assigned to current user (not supervised students)
const myStudents = useMemo(() => {
  if (!user) return [];
  return students.filter(student => student.tutorId === user.uid);
}, [students, user]);

  const [selectedWorksheetSources, setSelectedWorksheetSources] = useState<
    Set<string>
  >(new Set(worksheetSources));

  useEffect(() => {
    setSelectedWorksheetSources(new Set(worksheetSources));
  }, [worksheetSources]);

  const assignedAssignmentTitles = useMemo(() => {
    return Array.from(selectedAssignments.entries())
      .map(([id, options]) => {
        const assignment = assignments.find((a) => a.id === id);
        if (!assignment) return null;

        let title = assignment["Full Assignment Name"];
        if (assignment["isPracticeTest"]) {
          let details = [];
          if (
            options.sections &&
            Array.isArray(options.sections) &&
            options.sections.length > 0
          ) {
            const allSectionsForTest =
              SECTIONS_BY_TEST_TYPE[assignment["Test Type"] || ""] || [];
            if (options.sections.length === allSectionsForTest.length) {
              details.push("Whole Test");
            } else {
              details.push(options.sections.join(", "));
            }
          } else {
            details.push("Whole Test");
          }

          if (options.timing) {
            details.push(
              options.timing.charAt(0).toUpperCase() + options.timing.slice(1),
            );
          }

          if (details.length > 0) {
            title += ` (${details.join(", ")})`;
          }
        }
        return title;
      })
      .filter(Boolean);
  }, [selectedAssignments, assignments]);

  useEffect(() => {
    if (!selectedStudent) {
      setEmailMessage("");
      setEmailSubject("");
      return;
    }

    // Plain text version for editing
    const plainTextItems = assignedAssignmentTitles
      .map((title) => {
        const assignmentName = title?.split(" (")[0] || "";
        const assignment = assignments.find(
          (a) => a["Full Assignment Name"] === assignmentName,
        );

        if (assignment && assignment["Link"]) {
          return `${title}: ${assignment["Link"]}`;
        }
        return title;
      })
      .join("\n\n");

    const firstName = selectedStudent.name.split(" ")[0];
    const tutorName = user?.displayName?.split(" ")[0] || "Your Tutor";
    const plainMessage = `Hi ${firstName},

Here is your homework:

${plainTextItems}

Let me know if you have any questions.

Best,
${tutorName}`;

    setEmailMessage(plainMessage);
    setEmailSubject("");
  }, [selectedStudent, assignedAssignmentTitles, assignments]);

  const worksheets = useMemo(() => {
    if (!selectedStudent) return [];
    const studentTestTypes = selectedStudent["Test Types"] || [];
    return assignments
      .filter((a) => !a.isPracticeTest && !a.isOfficialTest)
      .filter((a) => {
        if (
          a["Test Type"] &&
          studentTestTypes.some((stt) => stt === a["Test Type"])
        ) {
          const sourceForFilter =
            a["Source"] === "Google Drive" ? "Question Bank" : a["Source"];
          if (selectedWorksheetSources.size === 0) return true;
          return (
            sourceForFilter && selectedWorksheetSources.has(sourceForFilter)
          );
        }
        return false;
      })
      .filter((a) => {
        if (worksheetSearchQuery.trim() === "") return true;
        return a["Full Assignment Name"]
          .toLowerCase()
          .includes(worksheetSearchQuery.toLowerCase());
      })
      .sort((a, b) =>
        a["Full Assignment Name"].localeCompare(b["Full Assignment Name"]),
      );
  }, [
    selectedStudent,
    assignments,
    worksheetSearchQuery,
    selectedWorksheetSources,
  ]);

  const practiceTests = useMemo(() => {
    if (!selectedStudent) return [];
    const studentTestTypes = selectedStudent["Test Types"] || [];
    return assignments
      .filter(
        (a) =>
          a.isPracticeTest &&
          a["Test Type"] &&
          studentTestTypes.includes(a["Test Type"]),
      )
      .sort((a, b) =>
        a["Full Assignment Name"].localeCompare(
          b["Full Assignment Name"],
          undefined,
          { numeric: true, sensitivity: "base" },
        ),
      );
  }, [selectedStudent, assignments]);

  const filteredAssignments = useMemo(() => {
    if (!selectedStudent) return [];

    // Combine worksheets and practice tests
    const allAssignments = [...worksheets, ...practiceTests];

    // Apply search filter if there's a search query
    if (worksheetSearchQuery.trim() === "") return allAssignments;

    return allAssignments.filter((assignment) =>
      assignment["Full Assignment Name"]
        .toLowerCase()
        .includes(worksheetSearchQuery.toLowerCase()),
    );
  }, [worksheets, practiceTests, worksheetSearchQuery, selectedStudent]);

  const studentSubmissions = useMemo(() => {
    if (!selectedStudentId) return [];
    return submissions
      .filter((sub) => sub.studentId === selectedStudentId)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }, [selectedStudentId, submissions]);

  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(studentId);
    setSelectedAssignments(new Map());
    setEmailSubject("");
    setWorksheetSearchQuery("");
  };

  const handleAssignmentToggle = (assignment: Assignment) => {
    const newSet = new Map(selectedAssignments);
    if (newSet.has(assignment.id)) {
      newSet.delete(assignment.id);
      setSelectedAssignments(newSet);
    } else {
      if (assignment["isPracticeTest"]) {
        setConfiguringAssignment(assignment);
        const sections =
          SECTIONS_BY_TEST_TYPE[assignment["Test Type"] || ""] || [];
        // Default to whole test
        setTempOptions({ timing: "timed", sections: sections });
      } else {
        newSet.set(assignment.id, {});
        setSelectedAssignments(newSet);
      }
    }
  };

  const handleSaveConfiguration = () => {
    if (configuringAssignment) {
      const newSet = new Map(selectedAssignments);
      newSet.set(configuringAssignment.id, tempOptions);
      setSelectedAssignments(newSet);
      setConfiguringAssignment(null);
      setTempOptions({});
    }
  };

  const handleCancelConfiguration = () => {
    setConfiguringAssignment(null);
    setTempOptions({});
  };

  const handleSourceToggle = (source: string) => {
    setSelectedWorksheetSources((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(source)) {
        newSet.delete(source);
      } else {
        newSet.add(source);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    if (!selectedStudentId || selectedAssignments.size === 0) {
      toast({
        title: "Missing Information",
        description: "Please select a student and at least one assignment.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Get student data client-side
      const student = await getStudentById(selectedStudentId);
      if (!student) {
        throw new Error("Student not found.");
      }

     // Extract first name and generate sending email
const firstName = user?.displayName?.split(' ')[0]?.toLowerCase() || 'tutor';
const generatedSendingEmail = `${firstName}@peakprep.tech`;

await sendHomeworkEmail({
  studentEmail: student.email,
  parentEmails: {
    parentEmail1: student.parentEmail1,
    parentEmail2: student.parentEmail2,
  },
  emailSubject,
  emailMessage: convertToHTML(emailMessage),
  ccParents,
  senderName: user?.displayName,
  senderEmail: generatedSendingEmail,
  replyToEmail: user?.email,  // Their login email from profile
});

      const assignmentsPayload = Array.from(selectedAssignments.entries()).map(
        ([id, options]) => ({
          id,
          sections: options.sections,
          timing: options.timing,
        }),
      );

      // Mark any reassigned submissions after successful email
      for (const assignmentPayload of assignmentsPayload) {
        const incompleteSubmission = studentSubmissions.find(
          (sub) =>
            sub.assignmentId === assignmentPayload.id &&
            sub.status === "Incomplete",
        );

        if (incompleteSubmission) {
          const oldSubmissionRef = doc(
            db,
            "submissions",
            incompleteSubmission.id,
          );
          await updateDoc(oldSubmissionRef, { status: "Reassigned" });
        }
      }

      // Create submission records for each assigned assignment
      for (const assignmentPayload of assignmentsPayload) {
        const submissionData = {
          studentId: selectedStudentId,
          assignmentId: assignmentPayload.id,
          status: "Assigned",
          submittedAt: new Date(),
          scores: [],
        };

        // Only add sections and timing if they exist
        if (assignmentPayload.sections) {
          (submissionData as any).sections = assignmentPayload.sections;
        }

        if (assignmentPayload.timing) {
          (submissionData as any).timing = assignmentPayload.timing;
        }

        await addDoc(collection(db, "submissions"), submissionData);
      }

      toast({
        title: "Homework Assigned!",
        description: `Homework assigned and email sent to ${student.name}.`,
      });

      // Reset form
      setSelectedAssignments(new Map());
      setEmailSubject("");
      setView("assignments");
    } catch (error: any) {
      toast({
        title: "Error Assigning Homework",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReassignFromHistory = (assignment: Assignment) => {
    if (!assignment) return;

    // Just add to cart - don't change any statuses yet
    const newSet = new Map(selectedAssignments);
    if (assignment["isPracticeTest"]) {
      setConfiguringAssignment(assignment);
      const sections =
        SECTIONS_BY_TEST_TYPE[assignment["Test Type"] || ""] || [];
      setTempOptions({ timing: "timed", sections: sections });
    } else {
      newSet.set(assignment.id, {});
      setSelectedAssignments(newSet);
    }

    toast({
      title: "Assignment Added",
      description: `${assignment["Full Assignment Name"]} added to compose email.`,
    });
  };

  const convertToHTML = (plainText: string) => {
    return plainText
      .split("\n")
      .map((line) => {
        // Handle assignment links: "Assignment Name: URL" → clickable assignment name
        // Note: Custom assignments should follow this format: "Custom Assignment: https://url.com"
        const assignmentLinkRegex = /^(.+?):\s+(https?:\/\/[^\s]+)$/;
        const assignmentMatch = line.match(assignmentLinkRegex);

        if (assignmentMatch) {
          const [, assignmentName, url] = assignmentMatch;
          return `<p><a href="${url}" style="color: #0066cc; text-decoration: none;">${assignmentName}</a></p>`;
        }

        // Handle any other standalone URLs (makes them clickable but visible)
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const linkedLine = line.replace(
          urlRegex,
          '<a href="$1" style="color: #0066cc; text-decoration: none;">$1</a>',
        );

        return `<p>${linkedLine}</p>`;
      })
      .join("");
  };

  const renderConfigurationDialog = () => {
    if (!configuringAssignment || !selectedStudent) return null;

    const testSections =
      SECTIONS_BY_TEST_TYPE[configuringAssignment["Test Type"] || ""] || [];
    const isSAT = configuringAssignment["Test Type"] === "SAT";

    return (
      <Dialog
        open={!!configuringAssignment}
        onOpenChange={(isOpen) => !isOpen && handleCancelConfiguration()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Configure: {configuringAssignment["Full Assignment Name"]}
            </DialogTitle>
            <DialogDescription>
              Select sections and timing for this practice test.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Sections</Label>
              {isSAT ? (
                <RadioGroup
                  value={
                    (tempOptions.sections?.length || 0) === testSections.length
                      ? "Whole Test"
                      : tempOptions.sections?.[0]
                  }
                  onValueChange={(value) => {
                    const newSections =
                      value === "Whole Test" ? testSections : [value];
                    setTempOptions((prev) => ({
                      ...prev,
                      sections: newSections,
                    }));
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Whole Test" id="whole-test" />
                    <Label htmlFor="whole-test">Whole Test</Label>
                  </div>
                  {testSections.map((section) => (
                    <div key={section} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={section}
                        id={`section-${section}`}
                      />
                      <Label htmlFor={`section-${section}`}>{section}</Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="whole-test"
                      checked={
                        (tempOptions.sections?.length || 0) ===
                        testSections.length
                      }
                      onCheckedChange={(checked) => {
                        setTempOptions((prev) => ({
                          ...prev,
                          sections: checked ? testSections : [],
                        }));
                      }}
                    />
                    <Label htmlFor="whole-test">Whole Test</Label>
                  </div>
                  {testSections.map((section) => (
                    <div
                      key={section}
                      className="flex items-center space-x-2 pl-6"
                    >
                      <Checkbox
                        id={`section-${section}`}
                        checked={tempOptions.sections?.includes(section)}
                        onCheckedChange={(checked) => {
                          setTempOptions((prev) => {
                            const currentSections = prev.sections || [];
                            const newSections = checked
                              ? [...currentSections, section]
                              : currentSections.filter((s) => s !== section);
                            return { ...prev, sections: newSections };
                          });
                        }}
                      />
                      <Label htmlFor={`section-${section}`}>{section}</Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Timing</Label>
              <RadioGroup
                value={tempOptions.timing}
                defaultValue="timed"
                onValueChange={(value: "timed" | "untimed") =>
                  setTempOptions((prev) => ({ ...prev, timing: value }))
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="timed" id="timed" />
                  <Label htmlFor="timed">Timed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="untimed" id="untimed" />
                  <Label htmlFor="untimed">Untimed</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" onClick={handleCancelConfiguration}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleSaveConfiguration}
              disabled={(tempOptions.sections?.length || 0) === 0}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const renderAssignmentSelectionDialog = () => (
    <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            Select Assignments for {selectedStudent?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search at top */}
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Search assignments..."
              value={worksheetSearchQuery}
              onChange={(e) => setWorksheetSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Tabs for Worksheets vs Practice Tests */}
          <Tabs defaultValue="worksheets" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="worksheets">
                Worksheets ({worksheets.length})
              </TabsTrigger>
              <TabsTrigger value="practice-tests">
                Practice Tests ({practiceTests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="worksheets" className="space-y-4">
              {/* Source filtering */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Sources:</Label>
                <div className="flex flex-wrap gap-2">
                  {worksheetSources.map((source) => (
                    <div key={source} className="flex items-center space-x-2">
                      <Checkbox
                        id={source}
                        checked={selectedWorksheetSources.has(source)}
                        onCheckedChange={() => handleSourceToggle(source)}
                      />
                      <Label htmlFor={source} className="text-sm">
                        {source}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scrollable worksheets list */}
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {worksheets.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center space-x-2 p-2 rounded border"
                    >
                      <Checkbox
                        checked={selectedAssignments.has(assignment.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleAssignmentToggle(assignment);
                          } else {
                            const newSet = new Map(selectedAssignments);
                            newSet.delete(assignment.id);
                            setSelectedAssignments(newSet);
                          }
                        }}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {assignment["Full Assignment Name"]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {assignment["Source"]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="practice-tests" className="space-y-4">
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {practiceTests.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center space-x-2 p-2 rounded border"
                    >
                      <Checkbox
                        checked={selectedAssignments.has(assignment.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleAssignmentToggle(assignment);
                          } else {
                            const newSet = new Map(selectedAssignments);
                            newSet.delete(assignment.id);
                            setSelectedAssignments(newSet);
                          }
                        }}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {assignment["Full Assignment Name"]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {assignment["Test Type"]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setShowAssignmentDialog(false)}
          >
            Cancel
          </Button>
          <Button onClick={() => setShowAssignmentDialog(false)}>
            Done ({selectedAssignments.size} selected)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="mx-auto w-full max-w-6xl">
      <h1 className="font-headline text-2xl font-bold tracking-tight md:text-3xl mb-6">
        Assign Homework
      </h1>
      {renderConfigurationDialog()}
      {renderAssignmentSelectionDialog()}

      {view === "assignments" && (
        <Card>
          <CardHeader className="sticky top-0 z-10 bg-card border-b">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
              <div>
                <CardTitle>Select Student and Assignments</CardTitle>
                <CardDescription>
                  Choose a student to see a filtered list of relevant
                  assignments.
                </CardDescription>
              </div>
              <Button
                className="w-full md:w-auto"
                disabled={selectedAssignments.size === 0}
                onClick={() => setView("email")}
              >
                Compose Email ({selectedAssignments.size})
              </Button>
            </div>
            <div className="pt-4">
              <Label htmlFor="student-select">Student</Label>
              <Select
                onValueChange={handleStudentChange}
                value={selectedStudentId ?? ""}
              >
                <SelectTrigger id="student-select" className="max-w-md">
                  <SelectValue placeholder="Select a student..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
  {myStudents
    .filter((s) => (s.status || "active") === "active")
    .map((student) => (
      <SelectItem key={student.id} value={student.id}>
        {student.name}
      </SelectItem>
    ))}
</SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {selectedStudent && (
              <>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        <span>
                          View Assignment History ({studentSubmissions.length})
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {studentSubmissions.length > 0 ? (
                        <ScrollArea className="h-48">
                          <ul className="space-y-2 pr-4">
                            {studentSubmissions.map((submission) => {
                              const assignment = assignments.find(
                                (a) => a.id === submission.assignmentId,
                              );
                              return (
                                <li
                                  key={submission.id}
                                  className={`flex justify-between items-center text-sm ${
                                    submission.status === "Incomplete"
                                      ? "text-red-600"
                                      : submission.status === "Reassigned"
                                        ? "text-red-500 italic"
                                        : ""
                                  }`}
                                >
                                  <span>
                                    {assignment?.["Full Assignment Name"] ||
                                      "Unknown Assignment"}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">
                                      {submission.submittedAt.toLocaleDateString()}
                                    </span>
                                    {submission.status === "Incomplete" && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          assignment &&
                                          handleReassignFromHistory(assignment)
                                        }
                                        className="text-xs px-2 py-1"
                                      >
                                        Reassign
                                      </Button>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </ScrollArea>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No assignment history for this student.
                        </p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {selectedStudentId && (
                  <div className="space-y-4">
                    <Button
                      onClick={() => setShowAssignmentDialog(true)}
                      variant="outline"
                      className="w-full"
                    >
                      Select Assignments ({selectedAssignments.size} selected)
                    </Button>

                    {selectedAssignments.size > 0 && (
                      <div className="bg-muted p-3 rounded">
                        <p className="text-sm font-medium mb-2">
                          Selected Assignments:
                        </p>
                        <div className="space-y-1">
                          {Array.from(selectedAssignments.keys()).map((id) => {
                            const assignment = assignments.find(
                              (a) => a.id === id,
                            );
                            return assignment ? (
                              <p key={id} className="text-xs">
                                {assignment["Full Assignment Name"]}
                              </p>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {view === "email" && (
        <Card>
          <CardHeader>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView("assignments")}
              className="w-fit p-0 h-auto mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Assignments
            </Button>
            <CardTitle>Compose Email</CardTitle>
            <CardDescription>
              Draft the email to send to{" "}
              {selectedStudent?.name || "the student"}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                placeholder="Your subject line..."
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                disabled={!selectedStudentId}
              />
            </div>
            <div>
              <Label htmlFor="message">Email Message</Label>
              <Textarea
                id="message"
                placeholder="Hi [Student Name], here is your homework..."
                rows={15}
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                disabled={!selectedStudentId}
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cc-parents"
                  disabled={
                    !selectedStudentId ||
                    (!selectedStudent?.parentEmail1 &&
                      !selectedStudent?.parentEmail2)
                  }
                  checked={ccParents}
                  onCheckedChange={(checked) => setCcParents(!!checked)}
                />
                <Label htmlFor="cc-parents">CC Parents</Label>
              </div>
            </div>
            <Button
              className="w-full"
              disabled={
                !selectedStudentId ||
                selectedAssignments.size === 0 ||
                isSubmitting
              }
              onClick={handleSubmit}
            >
              {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
              Assign Homework
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getLatestSubmissionDate(
  assignmentId: string,
  studentSubmissions: Submission[],
) {
  const submissionsForAssignment = studentSubmissions
    .filter((sub) => sub.assignmentId === assignmentId)
    .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

  return submissionsForAssignment.length > 0
    ? submissionsForAssignment[0].submittedAt
    : null;
}

function WorksheetTable({
  assignments,
  selectedAssignments,
  studentSubmissions,
  onToggle,
}: {
  assignments: Assignment[];
  selectedAssignments: Map<string, AssignmentOptions>;
  studentSubmissions: Submission[];
  onToggle: (assignment: Assignment) => void;
}) {
  return (
    <ScrollArea className="h-96 w-full">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Last Assigned</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment) => {
              const lastSubmitted = getLatestSubmissionDate(
                assignment.id,
                studentSubmissions,
              );
              const isSelected = selectedAssignments.has(assignment.id);
              return (
                <TableRow
                  key={assignment.id}
                  onClick={() => onToggle(assignment)}
                  className="cursor-pointer"
                  data-state={isSelected ? "selected" : ""}
                >
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggle(assignment)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {assignment["Full Assignment Name"]}
                  </TableCell>
                  <TableCell>{assignment["Source"]}</TableCell>
                  <TableCell>
                    {lastSubmitted ? lastSubmitted.toLocaleDateString() : "N/A"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </ScrollArea>
  );
}

function PracticeTestTable({
  assignments,
  selectedAssignments,
  studentSubmissions,
  onToggle,
}: {
  assignments: Assignment[];
  selectedAssignments: Map<string, AssignmentOptions>;
  studentSubmissions: Submission[];
  onToggle: (assignment: Assignment) => void;
}) {
  // Helper to extract test name from title
  const getTestName = (title: string) => {
    // This is a simple implementation, can be made more robust
    return title.replace(
      /(Bluebook|Test Innovators|Test Innovators Official Upper Level)\s*/,
      "",
    );
  };

  return (
    <ScrollArea className="h-96 w-full">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Test Name</TableHead>
              <TableHead>Last Assigned</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map((assignment) => {
              const lastSubmitted = getLatestSubmissionDate(
                assignment.id,
                studentSubmissions,
              );
              const isSelected = selectedAssignments.has(assignment.id);
              return (
                <TableRow
                  key={assignment.id}
                  onClick={() => onToggle(assignment)}
                  className="cursor-pointer"
                  data-state={isSelected ? "selected" : ""}
                >
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggle(assignment)}
                    />
                  </TableCell>
                  <TableCell>{assignment["Source"]}</TableCell>
                  <TableCell className="font-medium">
                    {getTestName(assignment["Full Assignment Name"])}
                  </TableCell>
                  <TableCell>
                    {lastSubmitted ? lastSubmitted.toLocaleDateString() : "N/A"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </ScrollArea>
  );
}
