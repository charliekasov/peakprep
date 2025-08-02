
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
import { getStudents } from '@/lib/students';
import type { Student } from '@/lib/types';
import { AddStudentSheet } from '@/components/add-student-sheet';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

function StudentDetails({ student }: { student: Student }) {
    if (!student) return null;
  
    return (
      <Card className="mt-4 animate-in fade-in">
        <CardHeader>
          <CardTitle>{student.name}</CardTitle>
          <CardDescription>
             Detailed information for {student.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Student Email</p>
                <p>{student.email}</p>
            </div>
             <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Parent Email 1</p>
                <p>{student.parentEmail1 || 'N/A'}</p>
            </div>
             <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Parent Email 2</p>
                <p>{student.parentEmail2 || 'N/A'}</p>
            </div>
            <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Target Score</p>
                <p>{student.targetScore || 'N/A'}</p>
            </div>
             <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Rate</p>
                <p>{student.rate ? `$${student.rate}` : 'N/A'}</p>
            </div>
            <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Frequency</p>
                <p>{student.frequency || 'N/A'}</p>
            </div>
             <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                <p>{student.startDate || 'N/A'}</p>
            </div>
             <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Projected End Date</p>
                <p>{student.projectedEndDate || 'N/A'}</p>
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

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    async function fetchStudents() {
        const studentData = await getStudents();
        setStudents(studentData);
    }
    fetchStudents();
  }, []);
  
  const handleRowClick = (student: Student) => {
    if (selectedStudent?.id === student.id) {
      setSelectedStudent(null); // Deselect if the same student is clicked
    } else {
      setSelectedStudent(student);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
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
              {students.map((student: Student) => (
                <TableRow 
                    key={student.id} 
                    onClick={() => handleRowClick(student)}
                    className={cn(
                        "cursor-pointer",
                        selectedStudent?.id === student.id && "bg-muted hover:bg-muted"
                    )}
                >
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.testType || 'N/A'}</TableCell>
                  <TableCell>{student.upcomingTestDate || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedStudent && <StudentDetails student={selectedStudent} />}
    </div>
  );
}
