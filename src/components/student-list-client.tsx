
'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import type { Student } from '@/lib/types';
import { AddStudentSheet } from '@/components/add-student-sheet';
import { EditStudentSheet } from '@/components/edit-student-sheet';
import { cn } from '@/lib/utils';
import { MoreHorizontal, Archive, ArchiveRestore } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { archiveStudentAction, unarchiveStudentAction } from '@/app/students/actions';

interface StudentListClientProps {
    students: Student[];
}

export function StudentListClient({ students }: StudentListClientProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [view, setView] = useState<'active' | 'archived'>('active');
  const { toast } = useToast();

  const filteredStudents = useMemo(() => {
    return students.filter(s => (s.status || 'active') === view);
  }, [students, view]);

  const handleRowClick = (student: Student) => {
    if (selectedStudent?.id === student.id) {
      setSelectedStudent(null);
    } else {
      setSelectedStudent(student);
    }
  };

  const onArchiveAction = async (student: Student) => {
    try {
        let result;
        if (student.status === 'active' || !student.status) {
            result = await archiveStudentAction(student.id);
            if (result.success) {
                toast({ title: 'Student Archived', description: `${student.name} has been moved to the archive.`});
            }
        } else {
            result = await unarchiveStudentAction(student.id);
            if (result.success) {
                toast({ title: 'Student Restored', description: `${student.name} has been moved back to active.`});
            }
        }
        if (!result.success) {
             throw new Error(result.message);
        }
    } catch (error: any) {
        toast({ title: 'Error', description: error.message, variant: 'destructive'});
    }
  };

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
          <CardTitle>All Students</CardTitle>
          <CardDescription>
            A list of all your students. Click a row to see more details.
          </CardDescription>
          <Tabs value={view} onValueChange={(value) => setView(value as any)} className="pt-4">
            <TabsList>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
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
              {filteredStudents.map((student: Student) => (
                <TableRow 
                    key={student.id} 
                    onClick={() => handleRowClick(student)}
                    className={cn(
                        "cursor-pointer",
                        selectedStudent?.id === student.id && "bg-muted hover:bg-muted"
                    )}
                >
                  <TableCell className="font-medium">{student['Student Name'] || student.name}</TableCell>
                  <TableCell>{student['Test Types']?.join(', ') || student.testType || 'N/A'}</TableCell>
                  <TableCell>{student['Upcoming Test Date'] || student.upcomingTestDate || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onSelect={() => setEditingStudent(student)}>
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <DropdownMenuItem onSelect={() => onArchiveAction(student)}>
                                {(student.status === 'active' || !student.status) ? (
                                    <><Archive className="mr-2 h-4 w-4" /> Archive</>
                                ) : (
                                    <><ArchiveRestore className="mr-2 h-4 w-4" /> Unarchive</>
                                )}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedStudent && (
        <Card className="mt-4 animate-in fade-in">
            <CardHeader>
                <CardTitle>{selectedStudent.name}</CardTitle>
                <CardDescription>
                    Detailed information for {selectedStudent.name}.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p>{selectedStudent.email || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Parent Email 1</p>
                        <p>{selectedStudent.parentEmail1 || 'N/A'}</p>
                    </div>
                     <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Parent Email 2</p>
                        <p>{selectedStudent.parentEmail2 || 'N/A'}</p>
                    </div>
                     <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Profile</p>
                        <p className="whitespace-pre-wrap">{selectedStudent.profile || 'N/A'}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
      )}

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
