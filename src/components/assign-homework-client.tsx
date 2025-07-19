
'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleAssignHomework } from '@/app/assign-homework/actions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


interface AssignHomeworkClientProps {
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
}

interface AssignmentOptions {
  sections?: string[] | string;
  timing?: 'timed' | 'untimed';
}

const SAT_SECTIONS = ['Reading + Writing', 'Math'];
const SSAT_SECTIONS = ['Verbal', 'Quantitative 1', 'Reading', 'Quantitative 2'];

export function AssignHomeworkClient({ students, assignments, submissions }: AssignHomeworkClientProps) {
  const [view, setView] = useState<'assignments' | 'email'>('assignments');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedAssignments, setSelectedAssignments] = useState<Map<string, AssignmentOptions>>(new Map());
  const [worksheetSearchQuery, setWorksheetSearchQuery] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [configuringAssignment, setConfiguringAssignment] = useState<Assignment | null>(null);
  const [tempOptions, setTempOptions] = useState<AssignmentOptions>({});


  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || null,
    [selectedStudentId, students]
  );
  
  const worksheetSources = useMemo(() => {
    const sources = new Set<string>();
    assignments
      .filter(a => !a.isPracticeTest)
      .forEach(a => {
        if (a.source) {
            const sourceName = a.source === 'Google Drive' ? 'Question Bank' : a.source;
            if (selectedStudent?.testType === 'Upper Level SSAT' && ['Tutorverse', 'Test Innovators'].includes(a.source)) {
                 sources.add(sourceName);
            } else if (selectedStudent?.testType === 'SAT' && ['Question Bank', 'Test Innovators'].includes(sourceName)){
                 sources.add(sourceName);
            }
        }
      });
    return Array.from(sources);
  }, [selectedStudent, assignments]);

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

    const assignedItems = Array.from(selectedAssignments.entries())
      .map(([id, options]) => {
        const assignment = assignments.find(a => a.id === id);
        if (!assignment) return null;

        let title = assignment.title;
        if (assignment.isPracticeTest) {
          let details = [];
          if (options.sections) {
            if (Array.isArray(options.sections)) {
              details.push(options.sections.join(', '));
            } else {
              details.push(options.sections);
            }
          }
          if (options.timing) {
            details.push(options.timing.charAt(0).toUpperCase() + options.timing.slice(1));
          }
          if (details.length > 0) {
            title += ` (${details.join(', ')})`;
          }
        }
        
        if (assignment.link) {
            return `${title}: ${assignment.link}`;
        }
        return title;
    }).filter(Boolean).join('\n\n');

    const firstName = selectedStudent.name.split(' ')[0];
    const message = `Hi ${firstName},\n\n${assignedItems}\n\nLet me know if you have any questions.\n\nBest,\nCharlie`;
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
     return relevantAssignments.filter(a => a.isPracticeTest);
  }, [relevantAssignments]);

  const worksheets = useMemo(() => {
    return relevantAssignments
      .filter(a => !a.isPracticeTest)
      .filter(a => {
        if (selectedWorksheetSources.size === 0) return true;
        const sourceForFilter = a.source === 'Google Drive' ? 'Question Bank' : a.source;
        return sourceForFilter && selectedWorksheetSources.has(sourceForFilter);
      })
      .filter(a => {
        if (worksheetSearchQuery.trim() === '') return true;
        return a.title.toLowerCase().includes(worksheetSearchQuery.toLowerCase());
      });
  }, [relevantAssignments, worksheetSearchQuery, selectedWorksheetSources]);

  const studentSubmissions = useMemo(() => {
    if (!selectedStudentId) return [];
    return submissions.filter(sub => sub.studentId === selectedStudentId);
  }, [selectedStudentId, submissions]);


  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(studentId);
    setSelectedAssignments(new Map()); 
    setEmailSubject('');
  };

  const handleAssignmentToggle = (assignment: Assignment) => {
    const newSet = new Map(selectedAssignments);
    if (newSet.has(assignment.id)) {
      newSet.delete(assignment.id);
      setSelectedAssignments(newSet);
    } else {
      if (assignment.isPracticeTest) {
        setConfiguringAssignment(assignment);
        setTempOptions({ timing: 'timed' }); 
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
      const assignmentsPayload = Array.from(selectedAssignments.entries()).map(([id, options]) => {
        const assignment = assignments.find(a => a.id === id)!;
        let sections: string[] = [];

        if(assignment.isPracticeTest) {
          if (Array.isArray(options.sections)) {
            sections = options.sections;
          } else if (typeof options.sections === 'string') {
            sections = [options.sections];
          }
        }
        
        return {
          id,
          sections: sections.length > 0 ? sections : undefined,
          timing: options.timing,
        };
      });
      
      await handleAssignHomework({
        studentId: selectedStudentId,
        assignments: assignmentsPayload,
        emailSubject,
        emailMessage,
      });
      toast({
        title: 'Homework Assigned!',
        description: `Email draft for ${selectedStudent?.name} has been logged.`,
      });
      // Reset form
      setSelectedAssignments(new Map());
      setEmailSubject('');
      setView('assignments');

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
  
  const renderConfigurationDialog = () => {
    if (!configuringAssignment || !selectedStudent) return null;
    const isSAT = selectedStudent.testType === 'SAT';
    const isSSAT = selectedStudent.testType === 'Upper Level SSAT';
    
    return (
       <Dialog open={!!configuringAssignment} onOpenChange={(isOpen) => !isOpen && handleCancelConfiguration()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure: {configuringAssignment.title}</DialogTitle>
              <DialogDescription>Select sections and timing for this practice test.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {isSAT && (
                 <div className="space-y-2">
                   <Label>Sections</Label>
                    <RadioGroup
                        value={typeof tempOptions.sections === 'string' ? tempOptions.sections : 'Whole Test'}
                        onValueChange={(value) => setTempOptions(prev => ({ ...prev, sections: value }))}
                    >
                      <div className="flex items-center space-x-2">
                         <RadioGroupItem value="Whole Test" id="sat-whole" />
                         <Label htmlFor="sat-whole">Whole Test</Label>
                      </div>
                      {SAT_SECTIONS.map(section => (
                         <div key={section} className="flex items-center space-x-2">
                             <RadioGroupItem value={section} id={`sat-${section}`} />
                             <Label htmlFor={`sat-${section}`}>{section}</Label>
                         </div>
                      ))}
                    </RadioGroup>
                 </div>
              )}
              {isSSAT && (
                  <div className="space-y-2">
                      <Label>Sections (select all that apply)</Label>
                      <div className="space-y-2">
                          {SSAT_SECTIONS.map(section => (
                              <div key={section} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`ssat-${section}`}
                                    checked={(Array.isArray(tempOptions.sections) && tempOptions.sections.includes(section))}
                                    onCheckedChange={(checked) => {
                                      setTempOptions(prev => {
                                        const currentSections = Array.isArray(prev.sections) ? prev.sections : [];
                                        if (checked) {
                                          return { ...prev, sections: [...currentSections, section] };
                                        } else {
                                          return { ...prev, sections: currentSections.filter(s => s !== section) };
                                        }
                                      })
                                    }}
                                />
                                <Label htmlFor={`ssat-${section}`}>{section}</Label>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
              <div className="space-y-2">
                  <Label>Timing</Label>
                   <RadioGroup
                        value={tempOptions.timing}
                        defaultValue="timed"
                        onValueChange={(value: 'timed' | 'untimed') => setTempOptions(prev => ({ ...prev, timing: value }))}
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
                 <Button variant="ghost" onClick={handleCancelConfiguration}>Cancel</Button>
              </DialogClose>
              <Button onClick={handleSaveConfiguration}>Save</Button>
            </DialogFooter>
          </DialogContent>
       </Dialog>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
       <h1 className="text-2xl font-bold tracking-tight md:text-3xl mb-6">Assign Homework</h1>
       {renderConfigurationDialog()}

      {view === 'assignments' && (
        <Card>
          <CardHeader className="sticky top-0 z-10 bg-card border-b">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
              <div>
                <CardTitle>Select Student and Assignments</CardTitle>
                <CardDescription>
                  Choose a student to see a filtered list of relevant assignments.
                </CardDescription>
              </div>
               <Button
                disabled={selectedAssignments.size === 0}
                onClick={() => setView('email')}
                className="w-full sm:w-auto"
              >
                Compose Email ({selectedAssignments.size})
              </Button>
            </div>
            <div className="pt-4">
              <Label htmlFor="student-select">Student</Label>
              <Select onValueChange={handleStudentChange} value={selectedStudentId ?? ''}>
                <SelectTrigger id="student-select" className="max-w-md">
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
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {selectedStudent && (
               <Tabs defaultValue="worksheets">
               <TabsList className="grid w-full grid-cols-2 max-w-md">
                 <TabsTrigger value="worksheets">Worksheets ({worksheets.length})</TabsTrigger>
                 <TabsTrigger value="practice-tests">Practice Tests ({practiceTests.length})</TabsTrigger>
               </TabsList>
               <TabsContent value="worksheets">
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative flex-1">
                           <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                           <Input 
                            placeholder="Search worksheets..." 
                            className="pl-8"
                            value={worksheetSearchQuery}
                            onChange={e => setWorksheetSearchQuery(e.target.value)}
                           />
                        </div>
                         {worksheetSources.length > 0 && (
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            <Label>Sources:</Label>
                              {worksheetSources.map(source => (
                                <div key={source} className="flex items-start space-x-2 pt-2">
                                  <Checkbox 
                                    id={`source-${source}`} 
                                    checked={selectedWorksheetSources.has(source)}
                                    onCheckedChange={() => handleSourceToggle(source)}
                                  />
                                  <div className="grid gap-1.5 leading-none">
                                    <Label htmlFor={`source-${source}`} className="font-normal">{source}</Label>
                                    {source === 'Question Bank' && (
                                       <p className="text-xs text-muted-foreground">(Google Drive)</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                         )}
                      </div>
                    </CardHeader>
                    <WorksheetTable assignments={worksheets} selectedAssignments={selectedAssignments} studentSubmissions={studentSubmissions} onToggle={handleAssignmentToggle} />
                  </Card>
               </TabsContent>
               <TabsContent value="practice-tests">
                  <PracticeTestTable assignments={practiceTests} selectedAssignments={selectedAssignments} studentSubmissions={studentSubmissions} onToggle={handleAssignmentToggle} />
               </TabsContent>
             </Tabs>
            )}
          </CardContent>
        </Card>
      )}

      {view === 'email' && (
        <Card>
          <CardHeader>
             <Button variant="ghost" size="sm" onClick={() => setView('assignments')} className="w-fit p-0 h-auto mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Assignments
            </Button>
            <CardTitle>Compose Email</CardTitle>
            <CardDescription>
              Draft the email to send to {selectedStudent?.name || 'the student'}.
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
                <Checkbox id="cc-parents" disabled={!selectedStudentId || !selectedStudent?.parentEmail1} />
                <Label htmlFor="cc-parents">CC Parents</Label>
              </div>
            </div>
            <Button 
              className="w-full" 
              disabled={!selectedStudentId || selectedAssignments.size === 0 || isSubmitting}
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

function getLatestSubmissionDate(assignmentId: string, studentSubmissions: Submission[]) {
  const submissionsForAssignment = studentSubmissions
    .filter(sub => sub.assignmentId === assignmentId)
    .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  
  return submissionsForAssignment.length > 0 ? submissionsForAssignment[0].submittedAt : null;
}

function WorksheetTable({ assignments, selectedAssignments, studentSubmissions, onToggle }: { assignments: Assignment[], selectedAssignments: Map<string, AssignmentOptions>, studentSubmissions: Submission[], onToggle: (assignment: Assignment) => void }) {
  return (
      <ScrollArea className="h-96 w-full">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Last Assigned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => {
                const lastSubmitted = getLatestSubmissionDate(assignment.id, studentSubmissions);
                const isSelected = selectedAssignments.has(assignment.id);
                return (
                  <TableRow 
                    key={assignment.id} 
                    onClick={() => onToggle(assignment)} 
                    className="cursor-pointer"
                    data-state={isSelected ? 'selected' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggle(assignment)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{assignment.title}</TableCell>
                    <TableCell>{assignment.subject}</TableCell>
                    <TableCell>{assignment.difficulty}</TableCell>
                    <TableCell>{assignment.source}</TableCell>
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

function PracticeTestTable({ assignments, selectedAssignments, studentSubmissions, onToggle }: { assignments: Assignment[], selectedAssignments: Map<string, AssignmentOptions>, studentSubmissions: Submission[], onToggle: (assignment: Assignment) => void }) {
  
  // Helper to extract test name from title
  const getTestName = (title: string) => {
    // This is a simple implementation, can be made more robust
    return title.replace(/(Bluebook|Test Innovators|Test Innovators Official Upper Level)\s*/, '');
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
                const lastSubmitted = getLatestSubmissionDate(assignment.id, studentSubmissions);
                const isSelected = selectedAssignments.has(assignment.id);
                return (
                  <TableRow 
                    key={assignment.id} 
                    onClick={() => onToggle(assignment)} 
                    className="cursor-pointer"
                    data-state={isSelected ? 'selected' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggle(assignment)}
                      />
                    </TableCell>
                    <TableCell>{assignment.source}</TableCell>
                    <TableCell className="font-medium">{getTestName(assignment.title)}</TableCell>
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
