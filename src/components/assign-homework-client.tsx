
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Student, Assignment, Submission } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from './ui/scroll-area';
import { Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleAssignHomework } from '@/app/assign-homework/actions';

interface AssignHomeworkClientProps {
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
}

const SAT_WORKSHEET_SOURCES = ['Question Bank', 'Test Innovators'];
const SSAT_WORKSHEET_SOURCES = ['Tutorverse', 'Test Innovators'];

export function AssignHomeworkClient({ students, assignments, submissions }: AssignHomeworkClientProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedAssignments, setSelectedAssignments] = useState<Set<string>>(new Set());
  const [worksheetSearchQuery, setWorksheetSearchQuery] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || null,
    [selectedStudentId, students]
  );
  
  const worksheetSources = useMemo(() => {
    if (selectedStudent?.testType === 'Upper Level SSAT') return SSAT_WORKSHEET_SOURCES;
    if (selectedStudent?.testType === 'SAT') return SAT_WORKSHEET_SOURCES;
    return [];
  }, [selectedStudent]);

  const [selectedWorksheetSources, setSelectedWorksheetSources] = useState<Set<string>>(new Set(worksheetSources));

  useEffect(() => {
    setSelectedWorksheetSources(new Set(worksheetSources));
  }, [worksheetSources]);

  useEffect(() => {
    if (!selectedStudent) {
      setEmailMessage('');
      setEmailSubject('');
      return;
    }

    const assignedItems = Array.from(selectedAssignments)
      .map(id => assignments.find(a => a.id === id))
      .filter(Boolean) as Assignment[];

    const assignmentList = assignedItems.map(a => {
        if (a.link) {
            return `${a.title}: ${a.link}`;
        }
        return a.title;
    }).join('\n\n');

    const firstName = selectedStudent.name.split(' ')[0];
    const message = `Hi ${firstName},\n\n${assignmentList}\n\nLet me know if you have any questions.\n\nBest,\nCharlie`;
    setEmailMessage(message);

  }, [selectedStudent, selectedAssignments, assignments]);


  const relevantAssignments = useMemo(() => {
    if (!selectedStudent || !selectedStudent.testType) {
      return [];
    }
    return assignments.filter(
      (a) => a.testType === selectedStudent.testType || !a.testType
    );
  }, [selectedStudent, assignments]);

  const practiceTests = useMemo(() => {
     const practiceTestSources = ['Bluebook', 'Test Innovators'];
     return relevantAssignments.filter(a => practiceTestSources.includes(a.source || ''));
  }, [relevantAssignments]);

  const worksheets = useMemo(() => {
    const practiceTestSources = ['Bluebook'];
    return relevantAssignments
      .filter(a => !practiceTestSources.includes(a.source || ''))
      .filter(a => {
        if (selectedWorksheetSources.size === 0) return true;
        const sourceForFilter = a.source === 'Google Drive' ? 'Question Bank' : a.source;
        return sourceForFilter && selectedWorksheetSources.has(sourceForFilter);
      })
      .filter(a => {
        if (worksheetSearchQuery.trim() === '') return true;
        return a.title.toLowerCase().includes(worksheetSearchQuery.toLowerCase());
      });
  }, [relevantAssignments, worksheetSearchQuery, selectedWorksheetSources, selectedStudent]);

  const studentSubmissions = useMemo(() => {
    if (!selectedStudentId) return [];
    return submissions.filter(sub => sub.studentId === selectedStudentId);
  }, [selectedStudentId, submissions]);


  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(studentId);
    setSelectedAssignments(new Set()); 
    setEmailSubject('');
  };

  const handleAssignmentToggle = (assignmentId: string) => {
    setSelectedAssignments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(assignmentId)) {
        newSet.delete(assignmentId);
      } else {
        newSet.add(assignmentId);
      }
      return newSet;
    });
  };

  const handleSourceToggle = (source: string) => {
    setSelectedWorksheetSources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(source)) {
        newSet.delete(source);
      } else {
        newSet.add(source);
      }
      return newSet;
    })
  }
  
  const handleSubmit = async () => {
    if (!selectedStudentId || selectedAssignments.size === 0) {
      toast({
        title: 'Missing Information',
        description: 'Please select a student and at least one assignment.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await handleAssignHomework({
        studentId: selectedStudentId,
        assignmentIds: Array.from(selectedAssignments),
        emailSubject,
        emailMessage,
      });
      toast({
        title: 'Homework Assigned!',
        description: `Email draft for ${selectedStudent?.name} has been logged.`,
      });
      // Reset form
      setSelectedAssignments(new Set());
      setEmailSubject('');

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign homework. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Assign Homework</h1>
      </div>

      <div className="grid flex-1 items-start gap-4 lg:grid-cols-3 lg:gap-8">
        {/* Left Column: Student and Assignments */}
        <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Select Student and Assignments</CardTitle>
              <CardDescription>
                Choose a student to see a filtered list of relevant assignments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="student-select">Student</Label>
                <Select onValueChange={handleStudentChange} value={selectedStudentId ?? ''}>
                  <SelectTrigger id="student-select">
                    <SelectValue placeholder="Select a student..." />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedStudent && (
                 <Tabs defaultValue="worksheets">
                 <TabsList className="grid w-full grid-cols-2">
                   <TabsTrigger value="worksheets">Worksheets ({worksheets.length})</TabsTrigger>
                   <TabsTrigger value="practice-tests">Practice Tests ({practiceTests.length})</TabsTrigger>
                 </TabsList>
                 <TabsContent value="worksheets">
                    <Card>
                      <CardHeader>
                        <div className="relative">
                           <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                           <Input 
                            placeholder="Search worksheets..." 
                            className="pl-8"
                            value={worksheetSearchQuery}
                            onChange={e => setWorksheetSearchQuery(e.target.value)}
                           />
                        </div>
                         {worksheetSources.length > 0 && (
                          <div className="mt-4 flex flex-wrap items-center gap-4">
                            <Label>Sources:</Label>
                              {worksheetSources.map(source => (
                                <div key={source} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`source-${source}`} 
                                    checked={selectedWorksheetSources.has(source)}
                                    onCheckedChange={() => handleSourceToggle(source)}
                                  />
                                  <Label htmlFor={`source-${source}`}>{source}</Label>
                                </div>
                              ))}
                          </div>
                         )}
                      </CardHeader>
                      <AssignmentTable assignments={worksheets} selectedAssignments={selectedAssignments} studentSubmissions={studentSubmissions} onToggle={handleAssignmentToggle} />
                    </Card>
                 </TabsContent>
                 <TabsContent value="practice-tests">
                  <AssignmentTable assignments={practiceTests} selectedAssignments={selectedAssignments} studentSubmissions={studentSubmissions} onToggle={handleAssignmentToggle} />
                 </TabsContent>
               </Tabs>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Email Composition */}
        <div className="sticky top-20">
          <Card>
            <CardHeader>
              <CardTitle>Compose Email</CardTitle>
              <CardDescription>
                Draft the email to send to the student.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="subject">Email Subject</Label>
                <Input 
                  id="subject" 
                  placeholder="Your subject line..." 
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
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
                  onChange={e => setEmailMessage(e.target.value)}
                  disabled={!selectedStudentId}
                />
              </div>
               <div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="cc-parents" disabled={!selectedStudentId} />
                  <Label htmlFor="cc-parents">CC Parents</Label>
                </div>
              </div>
              <Button 
                className="w-full" 
                disabled={!selectedStudentId || selectedAssignments.size === 0 || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                Assign Homework ({selectedAssignments.size})
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


function AssignmentTable({ assignments, selectedAssignments, studentSubmissions, onToggle }: { assignments: Assignment[], selectedAssignments: Set<string>, studentSubmissions: Submission[], onToggle: (id: string) => void }) {
  
  const getLatestSubmissionDate = (assignmentId: string) => {
    const submissionsForAssignment = studentSubmissions
      .filter(sub => sub.assignmentId === assignmentId)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
    
    return submissionsForAssignment.length > 0 ? submissionsForAssignment[0].submittedAt : null;
  }
  
  return (
      <ScrollArea className="h-96 w-full">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="min-w-[200px]">Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Last Assigned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => {
                const lastSubmitted = getLatestSubmissionDate(assignment.id);
                return (
                  <TableRow 
                    key={assignment.id} 
                    onClick={() => onToggle(assignment.id)} 
                    className="cursor-pointer"
                    data-state={selectedAssignments.has(assignment.id) ? 'selected' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedAssignments.has(assignment.id)}
                        onCheckedChange={() => onToggle(assignment.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{assignment.title}</TableCell>
                    <TableCell>{assignment.subject}</TableCell>
                    <TableCell>{assignment.difficulty}</TableCell>
                    <TableCell>{lastSubmitted ? lastSubmitted.toLocaleDateString() : 'N/A'}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </ScrollArea>
  )
}
