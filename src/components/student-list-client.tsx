
'use client';

import { useState } from 'react';
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
import type { Student } from '@/lib/types';
import { AddStudentSheet } from '@/components/add-student-sheet';
import { cn } from '@/lib/utils';

function StudentDetails({ student }: { student: Student }) {
    if (!student) return null;
  
    return (
      <Card className="mt-4 animate-in fade-in">
        <CardHeader>
          <CardTitle>{student['Student Name']}</CardTitle>
          <CardDescription>
             Detailed information for {student['Student Name']}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Student Email</p>
                <p>{student['Student Email'] || 'N/A'}</p>
            </div>
             <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Parent Email 1</p>
                <p>{student['Parent Email 1'] || 'N/A'}</p>
            </div>
             <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Parent Email 2</p>
                <p>{student['Parent Email 2'] || 'N/A'}</p>
            </div>
            <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Target Score</p>
                <p>{student['Target Score'] || 'N/A'}</p>
            </div>
             <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Rate</p>
                <p>{student['Rate'] ? `$${student['Rate']}` : 'N/A'}</p>
            </div>
            <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Frequency</p>
                <p>{student['Frequency'] || 'N/A'}</p>
            </div>
             <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                <p>{student['Start Date'] || 'N/A'}</p>
            </div>
             <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Projected End Date</p>
                <p>{student['Projected End Date'] || 'N/A'}</p>
            </div>
            <div className="space-y-1 md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Profile</p>
                <p className="whitespace-pre-wrap">{student.profile || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
}

interface StudentListClientProps {
    students: Student[];
}

export function StudentListClient({ students }: StudentListClientProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  const handleRowClick = (student: Student) => {
    if (selectedStudent?.id === student.id) {
      setSelectedStudent(null); // Deselect if the same student is clicked
    } else {
      setSelectedStudent(student);
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
            A list of all your current students. Click a row to see more details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Test Type</TableHead>
                <TableHead>Upcoming Test Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(students as any[]).map((student: any) => (
                <TableRow 
                    key={student.id} 
                    onClick={() => handleRowClick(student)}
                    className={cn(
                        "cursor-pointer",
                        selectedStudent?.id === student.id && "bg-muted hover:bg-muted"
                    )}
                >
                  <TableCell className="font-medium">{student['Student Name']}</TableCell>
                  <TableCell>{student['Test Type'] || 'N/A'}</TableCell>
                  <TableCell>{student['Upcoming Test Date'] || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedStudent && <StudentDetails student={selectedStudent} />}
    </>
  );
}
