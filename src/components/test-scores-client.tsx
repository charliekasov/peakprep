
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Student, Assignment, Submission } from '@/lib/types';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Line, LineChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { AddOfficialScoreDialog } from './add-official-score-dialog';

interface TestScoresClientProps {
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
  onScoreAdd: () => void;
}

const sourceColors: { [key: string]: string } = {
  'Official': '#16a34a', // green-600
  'Bluebook': '#3b82f6', // blue-500
  'Test Innovators': '#60a5fa', // blue-400
  'Test Innovators Official Upper Level': '#93c5fd', // blue-300
  'Official PSAT': '#a7f3d0', // green-200
  'Official SAT': '#34d399', // green-400
};

const sectionColors: { [key: string]: string } = {
  'Reading + Writing': '#8884d8',
  'Math': '#82ca9d',
  'Verbal Reasoning': '#ffc658',
  'Quantitative Reasoning': '#ff8042',
  'Reading Comprehension': '#0088FE',
}


export function TestScoresClient({ students, assignments, submissions, onScoreAdd }: TestScoresClientProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    if (students.length > 0) {
      setSelectedStudentId(students[0].id);
    }
  }, [students]);


  const [selectedSources, setSelectedSources] = useState<Set<string>>(
    new Set(Object.keys(sourceColors))
  );

  const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  const assignmentMap = useMemo(() => new Map(assignments.map(a => [a.id, a])), [assignments]);
  const practiceTests = useMemo(() => assignments.filter(a => a.isPracticeTest), [assignments]);

  const scoredSubmissions = useMemo(() => {
    return submissions.filter(s => {
       const assignment = assignmentMap.get(s.assignmentId);
       return (assignment?.isPracticeTest || s.isOfficial) &&
         s.status === 'Completed' &&
         s.scores &&
         s.scores.length > 0;
     });
  }, [submissions, assignmentMap]);

  const studentSubmissions = useMemo(() => {
    if (!selectedStudentId) return [];
    return scoredSubmissions
      .filter(s => s.studentId === selectedStudentId)
      .map(s => ({
        ...s,
        assignment: assignmentMap.get(s.assignmentId),
      }))
      .filter(s => s.assignment && selectedSources.has(s.assignment.Source || ''))
      .sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime());
  }, [selectedStudentId, scoredSubmissions, assignmentMap, selectedSources]);

  const chartData = useMemo(() => {
    return studentSubmissions.map(s => {
      const dataPoint: { [key: string]: any } = {
        name: s.assignment?.['Full Assignment Name'] || 'Unknown Test',
        date: s.submittedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      };
      s.scores?.forEach(score => {
        dataPoint[score.section] = score.score;
      });
      return dataPoint;
    });
  }, [studentSubmissions]);

  const allSections = useMemo(() => {
    const sections = new Set<string>();
    studentSubmissions.forEach(s => {
      s.scores?.forEach(score => sections.add(score.section));
    });
    return Array.from(sections);
  }, [studentSubmissions]);

  const handleSourceToggle = (source: string) => {
    setSelectedSources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(source)) {
        newSet.delete(source);
      } else {
        newSet.add(source);
      }
      return newSet;
    });
  };

  const selectedStudent = studentMap.get(selectedStudentId || '');
  
  if (!isMounted) {
    return null; // or a loading skeleton
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Test Scores</h1>
        <div className="flex items-center gap-2">
           <div className="w-full sm:w-64">
             <Select onValueChange={setSelectedStudentId} value={selectedStudentId || ''}>
               <SelectTrigger>
                 <SelectValue placeholder="Select a student..." />
               </SelectTrigger>
               <SelectContent>
                 {students.map(student => (
                   <SelectItem key={student.id} value={student.id}>
                     {student.name}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
           <AddOfficialScoreDialog 
              students={students} 
              assignments={practiceTests}
              onScoreAdded={onScoreAdd} 
            />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Score Visualization for {selectedStudent?.name || '...'}</CardTitle>
          <CardDescription>
            Practice and official test scores over time. Use the checkboxes to filter by test source.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {Object.keys(sourceColors).map(source => (
              <div key={source} className="flex items-center space-x-2">
                <Checkbox
                  id={`source-${source}`}
                  checked={selectedSources.has(source)}
                  onCheckedChange={() => handleSourceToggle(source)}
                  style={{ backgroundColor: selectedSources.has(source) ? sourceColors[source] : undefined, borderColor: sourceColors[source] }}
                />
                <Label htmlFor={`source-${source}`}>{source}</Label>
              </div>
            ))}
          </div>

          <div className="h-96 w-full">
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis type="number" domain={[200, 800]} ticks={[200, 300, 400, 500, 600, 700, 800]} />
                    <Tooltip />
                    <Legend />
                    {allSections.map((section, index) => (
                        <Line 
                            key={section} 
                            type="monotone"
                            dataKey={section} 
                            stroke={sectionColors[section] || Object.values(sourceColors)[index % Object.keys(sourceColors).length]}
                            strokeWidth={2}
                            activeDot={{ r: 8 }}
                         />
                    ))}
                </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                    <p>No test scores to display for {selectedStudent?.name || 'this student'}.</p>
                </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Scores Log</CardTitle>
          <CardDescription>
            A log of recently entered practice and official test scores for {selectedStudent?.name || '...'}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Scores</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...studentSubmissions].reverse().map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">
                    {submission.assignment?.['Full Assignment Name'] || 'Unknown Assignment'}
                  </TableCell>
                  <TableCell>
                    {submission.assignment?.Source || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {submission.submittedAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {submission.scores
                      ?.map((s) => `${s.section}: ${s.score}`)
                      .join(', ')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
