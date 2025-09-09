
'use client';

import { useState, useMemo, Fragment } from 'react';
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
import { archiveStudent, unarchiveStudent } from '@/lib/students';
import { useRouter } from 'next/navigation';

interface StudentListClientProps {
    students: Student[];
}

export function StudentListClient({ students }: StudentListClientProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [view, setView] = useState<'active' | 'archived'>('active');
  const { toast } = useToast();
  const router = useRouter();

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
        if (student.status === 'active' || !student.status) {
            await archiveStudent(student.id);
            toast({ title: 'Student Archived', description: `${student.name} has been moved to the archive.`});
        } else {
            await unarchiveStudent(student.id);
            toast({ title: 'Student Restored', description: `${student.name} has been moved back to active.`});
        }
        router.refresh();
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
                <Fragment key={student.id}>
                    <TableRow 
                        onClick={() => handleRowClick(student)}
                        className={cn(
                            "cursor-pointer",
                            selectedStudent?.id === student.id && "bg-muted/50"
                        )}
                    >
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.testTypes?.join(', ') || 'N/A'}</TableCell>
                      <TableCell>{student.upcomingTestDate || 'N/A'}</TableCell>
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
                    {selectedStudent?.id === student.id && (
                        <TableRow className="bg-muted/20 hover:bg-muted/20">
                            <TableCell colSpan={4} className="p-0">
                                <div className="p-6">
                                    <h3 className="font-semibold text-lg mb-4">{selectedStudent.name}'s Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Student Email</p>
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
                                            <p className="text-sm font-medium text-muted-foreground">Hourly Rate</p>
                                            <p>{selectedStudent['Rate'] ? `$${selectedStudent['Rate']}` : 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Preferred Time</p>
                                            <p>{selectedStudent['Frequency'] || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Time Zone</p>
                                            <p>{selectedStudent.timeZone || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1 md:col-span-3">
                                            <p className="text-sm font-medium text-muted-foreground">Profile Notes</p>
                                            <p className="whitespace-pre-wrap text-sm">
                                                {selectedStudent.profile || 'No profile notes for this student.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
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
