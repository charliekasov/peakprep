'use client';

import { useState, useMemo } from 'react';
import type { Student, Assignment } from '@/lib/types';
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
import { Search } from 'lucide-react';

interface AssignHomeworkClientProps {
  students: Student[];
  assignments: Assignment[];
}

const WORKSHEET_SOURCES = ['Google Drive', 'Test Innovators'];

export function AssignHomeworkClient({ students, assignments }: AssignHomeworkClientProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedAssignments, setSelectedAssignments] = useState<Set<string>>(new Set());
  const [worksheetSearchQuery, setWorksheetSearchQuery] = useState('');
  const [selectedWorksheetSources, setSelectedWorksheetSources] = useState<Set<string>>(new Set(WORKSHEET_SOURCES));

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || null,
    [selectedStudentId, students]
  );

  const relevantAssignments = useMemo(() => {
    if (!selectedStudent || !selectedStudent.testType) {
      return [];
    }
    return assignments.filter(
      (a) => a.testType === selectedStudent.testType || !a.testType
    );
  }, [selectedStudent, assignments]);

  const practiceTests = useMemo(() => {
     return relevantAssignments.filter(a => a.source === 'Bluebook' || a.source === 'Tutorverse');
  }, [relevantAssignments]);

  const worksheets = useMemo(() => {
    return relevantAssignments
      .filter(a => a.source === 'Google Drive' || (a.source === 'Test Innovators' && a.subject !== 'Analogies' && a.subject !== 'Synonym Bank: Medium' && a.subject !== 'Synonym Bank: Hard'))
      .filter(a => {
        // Source filter
        if (selectedWorksheetSources.size > 0 && a.source && !selectedWorksheetSources.has(a.source)) {
          return false;
        }
        // Search query filter
        if (worksheetSearchQuery.trim() === '') {
          return true;
        }
        return a.title.toLowerCase().includes(worksheetSearchQuery.toLowerCase());
      });
  }, [relevantAssignments, worksheetSearchQuery, selectedWorksheetSources]);

  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(studentId);
    setSelectedAssignments(new Set()); 
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

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Assign Homework</h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Student and Assignments */}
        <div className="lg:col-span-2">
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
                         <div className="mt-4 flex items-center space-x-4">
                           <Label>Sources:</Label>
                            {WORKSHEET_SOURCES.map(source => (
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
                      </CardHeader>
                      <AssignmentTable assignments={worksheets} selectedAssignments={selectedAssignments} onToggle={handleAssignmentToggle} />
                    </Card>
                 </TabsContent>
                 <TabsContent value="practice-tests">
                  <AssignmentTable assignments={practiceTests} selectedAssignments={selectedAssignments} onToggle={handleAssignmentToggle} />
                 </TabsContent>
               </Tabs>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Email Composition */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Compose Email</CardTitle>
              <CardDescription>
                Draft the email to send to the student.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="subject">Email Subject</Label>
                <Input id="subject" placeholder="Homework for..." />
              </div>
              <div>
                <Label htmlFor="message">Email Message</Label>
                <Textarea id="message" placeholder="Hi [Student Name], here is your homework..." rows={10} />
              </div>
               <div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="cc-parents" />
                  <Label htmlFor="cc-parents">CC Parents</Label>
                </div>
              </div>
              <Button className="w-full" disabled={!selectedStudentId || selectedAssignments.size === 0}>
                Assign Homework ({selectedAssignments.size})
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


function AssignmentTable({ assignments, selectedAssignments, onToggle }: { assignments: Assignment[], selectedAssignments: Set<string>, onToggle: (id: string) => void }) {
  return (
      <ScrollArea className="h-96">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Difficulty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id} 
                          onClick={() => onToggle(assignment.id)} 
                          className="cursor-pointer"
                          data-state={selectedAssignments.has(assignment.id) ? 'selected' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selectedAssignments.has(assignment.id)}
                      onCheckedChange={() => onToggle(assignment.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{assignment.title}</TableCell>
                  <TableCell>{assignment.subject}</TableCell>
                  <TableCell>{assignment.difficulty}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </ScrollArea>
  )
}
