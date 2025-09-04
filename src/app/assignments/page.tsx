
'use client';

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
import type { Assignment } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useData } from '@/context/data-provider';


export default function AssignmentsPage() {
  const { assignments, isLoading } = useData();

  // Helper to safely get property, accounting for different possible casings
  const getProp = (item: any, key: string) => item[key] || item[key.toLowerCase()];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
        Assignment Management
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>All Assignments</CardTitle>
          <CardDescription>
            A list of all available assignments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignment Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Test Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(assignments as any[]).map((assignment: any) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment['Full Assignment Name']}</TableCell>
                    <TableCell>{assignment.Subject}</TableCell>
                    <TableCell>{assignment['Broad Category']}</TableCell>
                    <TableCell>
                      <Badge variant={assignment.Difficulty === 'Hard' ? 'destructive' : (assignment.Difficulty === 'Medium' ? 'secondary' : 'default')}>{assignment.Difficulty}</Badge>
                    </TableCell>
                    <TableCell>{assignment['Test Type']}</TableCell>
                    <TableCell>{assignment.Source}</TableCell>
                    <TableCell>
                      {assignment.Link ? (
                        <Link href={assignment.Link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                          View <ExternalLink className="h-4 w-4" />
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
