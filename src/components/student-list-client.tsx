"use client";

import { useState, useMemo, Fragment } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import type { Student } from "@/lib/types";
import type { User } from "@/lib/user-roles";
import { AddStudentSheet } from "@/components/add-student-sheet";
import { EditStudentSheet } from "@/components/edit-student-sheet";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  MoreHorizontal,
  Archive,
  ArchiveRestore,
  Search,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { archiveStudent, unarchiveStudent } from "@/lib/students";
import { useRouter } from "next/navigation";

interface StudentListClientProps {
  students: Student[];
  supervisedStudents?: Student[];
  tutorGroups?: Record<string, { tutor: User; students: Student[] }>;
  isAdmin?: boolean;
}

export function StudentListClient({
  students,
  supervisedStudents,
  tutorGroups,
  isAdmin,
}: StudentListClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [view, setView] = useState<"active" | "archived" | "supervised">(
    "active",
  );
  const [expandedTutors, setExpandedTutors] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const router = useRouter();

  // Calculate tab counts
  const activeCount = students.filter(
    (s) => (s.status || "active") === "active",
  ).length;
  const archivedCount = students.filter(
    (s) => (s.status || "active") === "archived",
  ).length;
  const supervisedCount = supervisedStudents?.length || 0;

  const filteredStudents = useMemo(() => {
    let filtered: Student[] = [];

    if (view === "supervised" && supervisedStudents) {
      filtered = supervisedStudents;
    } else {
      filtered = students.filter((s) => (s.status || "active") === view);
    }

    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.testTypes?.some((type) =>
            type.toLowerCase().includes(searchQuery.toLowerCase()),
          ),
      );
    }

    return filtered;
  }, [students, supervisedStudents, view, searchQuery]);

  const handleRowClick = (student: Student) => {
    if (selectedStudent?.id === student.id) {
      setSelectedStudent(null);
    } else {
      setSelectedStudent(student);
    }
  };

  const toggleTutorExpansion = (tutorId: string) => {
    const newExpanded = new Set(expandedTutors);
    if (newExpanded.has(tutorId)) {
      newExpanded.delete(tutorId);
    } else {
      newExpanded.add(tutorId);
    }
    setExpandedTutors(newExpanded);
  };

  const onArchiveAction = async (student: Student) => {
    try {
      if (student.status === "active" || !student.status) {
        await archiveStudent(student.id);
        toast({
          title: "Student Archived",
          description: `${student.name} has been moved to the archive.`,
        });
      } else {
        await unarchiveStudent(student.id);
        toast({
          title: "Student Restored",
          description: `${student.name} has been moved back to active.`,
        });
      }
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const renderStudentRow = (student: Student, isSupervised = false) => (
    <Fragment key={student.id}>
      <TableRow
        onClick={() => handleRowClick(student)}
        className={cn(
          "cursor-pointer",
          selectedStudent?.id === student.id && "bg-muted/50",
        )}
      >
        <TableCell className="font-medium">{student.name}</TableCell>
        <TableCell>{student.testTypes?.join(", ") || "N/A"}</TableCell>
        <TableCell>{student.upcomingTestDate || "N/A"}</TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onSelect={() => setEditingStudent(student)}>
                Edit
              </DropdownMenuItem>
              {!isSupervised && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => onArchiveAction(student)}>
                    {student.status === "active" || !student.status ? (
                      <>
                        <Archive className="mr-2 h-4 w-4" /> Archive
                      </>
                    ) : (
                      <>
                        <ArchiveRestore className="mr-2 h-4 w-4" /> Unarchive
                      </>
                    )}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      {selectedStudent?.id === student.id && (
        <TableRow className="bg-muted/20 hover:bg-muted/20">
          <TableCell colSpan={4} className="p-0">
            <div className="p-6">
              <h3 className="font-semibold text-lg mb-4">
                {selectedStudent.name}'s Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Student Email
                  </p>
                  <p className="break-all">{selectedStudent.email || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Parent Email 1
                  </p>
                  <p className="break-all">
                    {selectedStudent.parentEmail1 || "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Parent Email 2
                  </p>
                  <p className="break-all">
                    {selectedStudent.parentEmail2 || "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Hourly Rate
                  </p>
                  <p>
                    {selectedStudent["Rate"]
                      ? `$${selectedStudent["Rate"]}`
                      : "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Preferred Time
                  </p>
                  <p>{selectedStudent["Frequency"] || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Time Zone
                  </p>
                  <p>{selectedStudent.timeZone || "N/A"}</p>
                </div>
                <div className="space-y-1 md:col-span-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Profile Notes
                  </p>
                  <p className="whitespace-pre-wrap text-sm">
                    {selectedStudent.profile ||
                      "No profile notes for this student."}
                  </p>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  );

  const renderStudentCard = (student: Student, isSupervised = false) => (
    <div key={student.id} className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-1 flex-1">
          <h3 className="font-semibold">{student.name}</h3>
          <p className="text-sm text-muted-foreground">
            {student.testTypes?.join(", ") || "N/A"}
          </p>
          <p className="text-sm text-muted-foreground">
            {student.upcomingTestDate || "N/A"}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => setEditingStudent(student)}>
              Edit
            </DropdownMenuItem>
            {!isSupervised && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => onArchiveAction(student)}>
                  {student.status === "active" || !student.status ? (
                    <>
                      <Archive className="mr-2 h-4 w-4" /> Archive
                    </>
                  ) : (
                    <>
                      <ArchiveRestore className="mr-2 h-4 w-4" /> Unarchive
                    </>
                  )}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile expandable details */}
      {selectedStudent?.id === student.id && (
        <div className="border-t pt-3 mt-3 space-y-3">
          <h4 className="font-medium text-lg">
            {selectedStudent.name}'s Details
          </h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Student Email:</span>{" "}
              <span className="break-all">
                {selectedStudent.email || "N/A"}
              </span>
            </div>
            <div>
              <span className="font-medium">Parent Email 1:</span>{" "}
              <span className="break-all">
                {selectedStudent.parentEmail1 || "N/A"}
              </span>
            </div>
            <div>
              <span className="font-medium">Parent Email 2:</span>{" "}
              <span className="break-all">
                {selectedStudent.parentEmail2 || "N/A"}
              </span>
            </div>
            <div>
              <span className="font-medium">Hourly Rate:</span>{" "}
              {selectedStudent["Rate"] ? `$${selectedStudent["Rate"]}` : "N/A"}
            </div>
            <div>
              <span className="font-medium">Preferred Time:</span>{" "}
              {selectedStudent["Frequency"] || "N/A"}
            </div>
            <div>
              <span className="font-medium">Time Zone:</span>{" "}
              {selectedStudent.timeZone || "N/A"}
            </div>
            <div>
              <span className="font-medium">Profile Notes:</span>
            </div>
            <p className="whitespace-pre-wrap text-sm pl-2">
              {selectedStudent.profile || "No profile notes for this student."}
            </p>
          </div>
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="w-full"
        onClick={() => handleRowClick(student)}
      >
        {selectedStudent?.id === student.id ? "Hide Details" : "Show Details"}
      </Button>
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Student Management
        </h1>
        <AddStudentSheet />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>Click a row for more details.</CardDescription>
          <div className="flex items-center space-x-2 pt-4">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Tabs
            value={view}
            onValueChange={(value) => setView(value as any)}
            className="pt-4"
          >
            <TabsList>
              <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
              <TabsTrigger value="archived">
                Archived ({archivedCount})
              </TabsTrigger>
              {isAdmin && supervisedStudents && (
                <TabsTrigger value="supervised">
                  Supervised ({supervisedCount})
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {/* Mobile: Card layout */}
          <div className="block md:hidden space-y-4">
            {view === "supervised" && tutorGroups
              ? Object.entries(tutorGroups).map(
                  ([tutorId, { tutor, students: tutorStudents }]) => {
                    const filteredTutorStudents = tutorStudents.filter(
                      (student) => {
                        if (searchQuery.trim() === "") return true;
                        return (
                          student.name
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                          student.email
                            ?.toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                          student.testTypes?.some((type) =>
                            type
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase()),
                          )
                        );
                      },
                    );

                    if (filteredTutorStudents.length === 0) return null;

                    return (
                      <Collapsible
                        key={tutorId}
                        open={expandedTutors.has(tutorId)}
                        onOpenChange={() => toggleTutorExpansion(tutorId)}
                      >
                        <CollapsibleTrigger asChild>
  <Button variant="ghost" className="w-full justify-between p-4 h-auto">
    <div className="text-left">
      <h3 className="font-semibold">{tutor.displayName}</h3>
      <p className="text-sm text-muted-foreground">
        {filteredTutorStudents.length} student{filteredTutorStudents.length !== 1 ? 's' : ''}
      </p>
    </div>
    {expandedTutors.has(tutorId) ? (
      <ChevronDown className="h-4 w-4" />
    ) : (
      <ChevronRight className="h-4 w-4" />
    )}
  </Button>
</CollapsibleTrigger>
                        <CollapsibleContent className="space-y-4 pt-2">
                          {filteredTutorStudents.map((student) =>
                            renderStudentCard(student, true),
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  },
                )
              : filteredStudents.map((student) => renderStudentCard(student))}
          </div>

          {/* Desktop: Table layout */}
          <div className="hidden md:block">
            {view === "supervised" && tutorGroups ? (
              <div className="space-y-6">
                {Object.entries(tutorGroups).map(
                  ([tutorId, { tutor, students: tutorStudents }]) => {
                    const filteredTutorStudents = tutorStudents.filter(
                      (student) => {
                        if (searchQuery.trim() === "") return true;
                        return (
                          student.name
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                          student.email
                            ?.toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                          student.testTypes?.some((type) =>
                            type
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase()),
                          )
                        );
                      },
                    );

                    if (filteredTutorStudents.length === 0) return null;

                    return (
                      <Collapsible
                        key={tutorId}
                        open={expandedTutors.has(tutorId)}
                        onOpenChange={() => toggleTutorExpansion(tutorId)}
                      >
                        <CollapsibleTrigger asChild>
  <Button variant="ghost" className="w-full justify-between p-4 h-auto mb-2">
    <div className="text-left">
      <h3 className="font-semibold text-lg">{tutor.displayName}</h3>
      <p className="text-sm text-muted-foreground">
        {filteredTutorStudents.length} student{filteredTutorStudents.length !== 1 ? 's' : ''}
      </p>
    </div>
    {expandedTutors.has(tutorId) ? (
      <ChevronDown className="h-4 w-4" />
    ) : (
      <ChevronRight className="h-4 w-4" />
    )}
  </Button>
</CollapsibleTrigger>
                        <CollapsibleContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Test Types</TableHead>
                                <TableHead>Upcoming Test Date</TableHead>
                                <TableHead className="text-right">
                                  Actions
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredTutorStudents.map((student) =>
                                renderStudentRow(student, true),
                              )}
                            </TableBody>
                          </Table>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  },
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Test Types</TableHead>
                    <TableHead>Upcoming Test Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => renderStudentRow(student))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {editingStudent && (
        <EditStudentSheet
          student={editingStudent}
          isOpen={!!editingStudent}
          onOpenChange={(isOpen) => !isOpen && setEditingStudent(null)}
        />
      )}
    </>
  );
}
