
'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { ExternalLink, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface AssignmentsClientProps {
    assignments: Assignment[];
}

export function AssignmentsClient({ assignments }: AssignmentsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTestType, setSelectedTestType] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Effect to reset dependent filters when a parent filter changes
  useEffect(() => {
    setSelectedSource('all');
    setSelectedCategory('all');
    setSelectedSubject('all');
  }, [selectedTestType]);

  useEffect(() => {
    setSelectedCategory('all');
    setSelectedSubject('all');
  }, [selectedSource]);

  useEffect(() => {
    setSelectedSubject('all');
  }, [selectedCategory]);

  const filteredAssignments = useMemo(() => {
    let filtered = assignments;

    if (selectedTestType !== 'all') {
      filtered = filtered.filter(a => a['Test Type'] === selectedTestType);
    }
    if (selectedSource !== 'all') {
      filtered = filtered.filter(a => a['Source'] === selectedSource);
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a['Broad Category'] === selectedCategory);
    }
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(a => a['Subject'] === selectedSubject);
    }

    if (searchQuery) {
      filtered = filtered.filter(a =>
        a['Full Assignment Name']?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [assignments, searchQuery, selectedTestType, selectedSource, selectedCategory, selectedSubject]);

  const getUniqueValues = (key: keyof Assignment, sourceData: Assignment[]) => {
    return Array.from(new Set(sourceData.map(a => a[key]).filter(Boolean)));
  };

  const testTypes = useMemo(() => getUniqueValues('Test Type', assignments), [assignments]);
  
  const sources = useMemo(() => {
    let filtered = assignments;
    if (selectedTestType !== 'all') {
      filtered = filtered.filter(a => a['Test Type'] === selectedTestType);
    }
    return getUniqueValues('Source', filtered);
  }, [assignments, selectedTestType]);

  const categories = useMemo(() => {
    let filtered = assignments;
    if (selectedTestType !== 'all') {
      filtered = filtered.filter(a => a['Test Type'] === selectedTestType);
    }
    if (selectedSource !== 'all') {
      filtered = filtered.filter(a => a['Source'] === selectedSource);
    }
    return getUniqueValues('Broad Category', filtered);
  }, [assignments, selectedTestType, selectedSource]);

  const subjects = useMemo(() => {
    let filtered = assignments;
     if (selectedTestType !== 'all') {
      filtered = filtered.filter(a => a['Test Type'] === selectedTestType);
    }
    if (selectedSource !== 'all') {
      filtered = filtered.filter(a => a['Source'] === selectedSource);
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a['Broad Category'] === selectedCategory);
    }
    return getUniqueValues('Subject', filtered);
  }, [assignments, selectedTestType, selectedSource, selectedCategory]);


  const resetFilters = () => {
    setSearchQuery('');
    setSelectedTestType('all');
    setSelectedSource('all');
    setSelectedCategory('all');
    setSelectedSubject('all');
  }

  const hasActiveFilters = 
    searchQuery !== '' ||
    selectedTestType !== 'all' ||
    selectedSource !== 'all' ||
    selectedCategory !== 'all' ||
    selectedSubject !== 'all';


  return (
      <Card>
        <CardHeader>
          <CardTitle>All Assignments</CardTitle>
          <CardDescription>
            A list of all available assignments. Use the filters to narrow your search.
          </CardDescription>
           <div className="mt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by assignment name..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Select value={selectedTestType} onValueChange={setSelectedTestType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Test Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Test Types</SelectItem>
                  {testTypes.map((type) => (
                    <SelectItem key={type as string} value={type as string}>
                      {type as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedSource} onValueChange={setSelectedSource} disabled={selectedTestType === 'all'}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {sources.map((source) => (
                    <SelectItem key={source as string} value={source as string}>
                      {source as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
               <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={selectedSource === 'all'}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat as string} value={cat as string}>
                      {cat as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
               <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={selectedCategory === 'all'}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map((sub) => (
                    <SelectItem key={sub as string} value={sub as string}>
                      {sub as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             {hasActiveFilters && (
                <Button variant="ghost" onClick={resetFilters} className="h-auto p-0 text-sm">
                  Clear Filters
                </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
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
                {filteredAssignments.map((assignment: any) => (
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
        </CardContent>
      </Card>
  );
}
