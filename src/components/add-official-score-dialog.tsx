
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleAddTestScore } from '@/app/test-scores/actions';
import type { Student, Assignment } from '@/lib/types';
import { Stepper } from '@/components/ui/stepper';

interface AddOfficialScoreDialogProps {
  students: Student[];
  assignments: Assignment[];
  onScoreAdd: () => void;
}

const scoreSchema = z.object({
  section: z.string(),
  score: z.coerce.number(),
});

const formSchema = z.object({
  studentId: z.string().min(1, 'Student is required.'),
  testTypeSelection: z.string().min(1, 'Test type is required.'),
  officialTestName: z.string().optional(),
  practiceTestId: z.string().optional(),
  month: z.string().min(1, 'Month is required.'),
  year: z.string().min(1, 'Year is required.'),
  scores: z.array(scoreSchema).optional(),
});

const getStanine = (percentile: number) => {
  if (percentile >= 96) return 9;
  if (percentile >= 89) return 8;
  if (percentile >= 77) return 7;
  if (percentile >= 60) return 6;
  if (percentile >= 40) return 5;
  if (percentile >= 23) return 4;
  if (percentile >= 11) return 3;
  if (percentile >= 4) return 2;
  return 1;
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS = Array.from({ length: 10 }, (_, i) => (2024 + i).toString());

const TEST_CONFIG: any = {
  'SAT': {
    sections: [{ name: 'Reading + Writing', min: 200, max: 800, step: 10, default: 600 }, { name: 'Math', min: 200, max: 800, step: 10, default: 600 }],
  },
  'ACT': {
    sections: [{ name: 'English', min: 1, max: 36, step: 1, default: 27 }, { name: 'Math', min: 1, max: 36, step: 1, default: 27 }, { name: 'Reading', min: 1, max: 36, step: 1, default: 27 }, { name: 'Science', min: 1, max: 36, step: 1, default: 27 }],
  },
  'Upper Level SSAT': {
    sections: [{ name: 'Verbal', min: 1, max: 99, step: 1, default: 65 }, { name: 'Reading', min: 1, max: 99, step: 1, default: 65 }, { name: 'Quantitative', min: 1, max: 99, step: 1, default: 65 }],
  },
   'Middle Level SSAT': {
    sections: [{ name: 'Verbal', min: 1, max: 99, step: 1, default: 65 }, { name: 'Reading', min: 1, max: 99, step: 1, default: 65 }, { name: 'Quantitative', min: 1, max: 99, step: 1, default: 65 }],
  },
  'Upper Level ISEE': {
    sections: [{ name: 'Verbal Reasoning', min: 1, max: 99, step: 1, default: 65 }, { name: 'Quantitative Reasoning', min: 1, max: 99, step: 1, default: 65 }, { name: 'Reading Comprehension', min: 1, max: 99, step: 1, default: 65 }, { name: 'Math Achievement', min: 1, max: 99, step: 1, default: 65 }],
  },
  'Middle Level ISEE': {
    sections: [{ name: 'Verbal Reasoning', min: 1, max: 99, step: 1, default: 65 }, { name: 'Quantitative Reasoning', min: 1, max: 99, step: 1, default: 65 }, { name: 'Reading Comprehension', min: 1, max: 99, step: 1, default: 65 }, { name: 'Math Achievement', min: 1, max: 99, step: 1, default: 65 }],
  }
};


export function AddOfficialScoreDialog({ students, assignments, onScoreAdd }: AddOfficialScoreDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: '',
      testTypeSelection: '',
      officialTestName: '',
      practiceTestId: '',
      month: (new Date().getMonth()).toString(),
      year: new Date().getFullYear().toString(),
      scores: [],
    },
  });

  const { watch, resetField, setValue, reset, trigger } = form;
  const studentId = watch('studentId');
  const testTypeSelection = watch('testTypeSelection');
  const scores = watch('scores') || [];

  const selectedStudent = useMemo(() => students.find(s => s.id === studentId), [studentId, students]);
  const studentTestType = selectedStudent?.['Test Type'];

  const filteredPracticeTests = useMemo(() => {
    if (!studentTestType) return [];
    return assignments.filter(a => a.isPracticeTest && a['Test Type'] === studentTestType);
  }, [studentTestType, assignments]);

  const currentTestConfig = useMemo(() => {
    if (!studentTestType) return null;
    return TEST_CONFIG[studentTestType];
  }, [studentTestType]);
  
  const isStanineTest = useMemo(() => studentTestType?.includes('SSAT') || studentTestType?.includes('ISEE'), [studentTestType]);

  useEffect(() => {
    // When student changes, reset the form fields but keep studentId
    if (studentId) {
        const student = students.find(s => s.id === studentId);
        const testType = student?.['Test Type'] || '';
        const config = TEST_CONFIG[testType];
        
        reset({
            studentId: studentId,
            testTypeSelection: 'Practice Test',
            practiceTestId: '',
            officialTestName: '',
            month: (new Date().getMonth()).toString(),
            year: new Date().getFullYear().toString(),
            scores: config ? config.sections.map((s: any) => ({ section: s.name, score: s.default })) : [],
        });
        
    }
  }, [studentId, students, reset]);
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const monthIndex = parseInt(values.month, 10);
      const year = parseInt(values.year, 10);
      const testDate = new Date(year, monthIndex, 15); // Use 15th to avoid timezone issues

      const isOfficial = values.testTypeSelection.startsWith('Official');
      
      const payload: any = {
        studentId: values.studentId,
        testDate,
        scores: values.scores,
      };

      if (isOfficial) {
         payload.testType = values.testTypeSelection;
         payload.assignmentId = values.officialTestName; 
      } else {
        const practiceAssignment = assignments.find(a => a.id === values.practiceTestId);
        payload.assignmentId = values.practiceTestId;
        payload.testType = practiceAssignment?.['Test Type'];
      }
      
      if(!payload.assignmentId) {
        toast({
          title: 'Missing Information',
          description: 'Please select a practice test or enter an official test name.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      await handleAddTestScore(payload);

      toast({
        title: 'Score Added',
        description: 'The test score has been successfully recorded.',
      });
      onScoreAdd();
      setOpen(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: 'Error Adding Score',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Test Score
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90svh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Test Score</DialogTitle>
          <DialogDescription>
            Record an official or practice test score for a student.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-6 -mr-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {studentId && studentTestType && (
              <>
                <FormField
                  control={form.control}
                  name="testTypeSelection"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Test Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select test type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Practice Test">Practice Test</SelectItem>
                          <SelectItem value={`Official ${studentTestType}`}>{`Official ${studentTestType}`}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {testTypeSelection === 'Practice Test' && (
                  <FormField
                    control={form.control}
                    name="practiceTestId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Practice Test</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a practice test" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredPracticeTests.map((test) => (
                              <SelectItem key={test.id} value={test.id}>
                                {test['Full Assignment Name']}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {testTypeSelection.startsWith('Official') && (
                  <FormField
                    control={form.control}
                    name="officialTestName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Test Name / Date</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., May 2024 Digital SAT" {...field} />
                        </FormControl>
                         <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-2 gap-4">
                   <FormField
                      control={form.control}
                      name="month"
                      render={({ field }) => (
                        <FormItem>
                           <FormLabel>Month</FormLabel>
                           <Select onValueChange={field.onChange} value={field.value}>
                             <FormControl>
                               <SelectTrigger>
                                 <SelectValue placeholder="Select month" />
                               </SelectTrigger>
                             </FormControl>
                             <SelectContent>
                               {MONTHS.map((month, index) => (
                                 <SelectItem key={month} value={index.toString()}>{month}</SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                           <FormLabel>Year</FormLabel>
                           <Select onValueChange={field.onChange} value={field.value}>
                             <FormControl>
                               <SelectTrigger>
                                 <SelectValue placeholder="Select year" />
                               </SelectTrigger>
                             </FormControl>
                             <SelectContent>
                               {YEARS.map(year => (
                                 <SelectItem key={year} value={year}>{year}</SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                
                 {currentTestConfig && (
                    <div className="space-y-4 pt-4">
                        <FormLabel>Scores</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 rounded-md border p-4">
                            {currentTestConfig.sections.map((section: any, index: number) => (
                                <Controller
                                    key={section.name}
                                    control={form.control}
                                    name={`scores.${index}.score`}
                                    defaultValue={section.default}
                                    render={({ field }) => (
                                       <FormItem>
                                          <div className="flex items-center justify-between">
                                            <FormLabel>{section.name}</FormLabel>
                                            {isStanineTest && scores[index]?.score > 0 && (
                                                <span className="text-sm font-medium text-muted-foreground">
                                                  Stanine: {getStanine(scores[index].score)}
                                                </span>
                                            )}
                                          </div>
                                          <FormControl>
                                             <Stepper
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                min={section.min}
                                                max={section.max}
                                                step={section.step}
                                              />
                                          </FormControl>
                                          <FormMessage />
                                       </FormItem>
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                )}
              </>
            )}
            <DialogFooter className="sticky bottom-0 bg-background pt-4">
              <DialogClose asChild>
                <Button type="button" variant="ghost">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Score
              </Button>
            </DialogFooter>
          </form>
        </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

    