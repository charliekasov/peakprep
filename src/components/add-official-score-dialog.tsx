
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

const formSchema = z
  .object({
    studentId: z.string().min(1, 'Student is required.'),
    testTypeSelection: z.string().min(1, 'Test type is required.'),
    officialTestName: z.string().optional(),
    practiceTestId: z.string().optional(),
    month: z.string().min(1, 'Month is required.'),
    year: z.string().min(1, 'Year is required.'),
    day: z.string().optional(),
    scores: z.array(scoreSchema).optional(),
  })
  .refine(
    (data) => {
      if (data.testTypeSelection.startsWith('Official')) {
        return !!data.officialTestName && data.officialTestName.length > 0;
      }
      return true;
    },
    {
      message: 'Test name is required for official tests.',
      path: ['officialTestName'],
    }
  )
  .refine(
    (data) => {
      if (data.testTypeSelection === 'Practice Test') {
        return !!data.practiceTestId && data.practiceTestId.length > 0;
      }
      return true;
    },
    {
      message: 'Please select a practice test.',
      path: ['practiceTestId'],
    }
  );


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
  { name: 'January', value: '0' }, { name: 'February', value: '1' }, { name: 'March', value: '2' }, 
  { name: 'April', value: '3' }, { name: 'May', value: '4' }, { name: 'June', value: '5' },
  { name: 'July', value: '6' }, { name: 'August', value: '7' }, { name: 'September', value: '8' },
  { name: 'October', value: '9' }, { name: 'November', value: '10' }, { name: 'December', value: '11' }
];


const YEARS = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - 5 + i).toString());

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
      day: '',
      scores: [],
    },
  });

  const { watch, reset, setValue, handleSubmit } = form;
  const studentId = watch('studentId');
  const testTypeSelection = watch('testTypeSelection');

  const selectedStudent = useMemo(() => students.find(s => s.id === studentId), [studentId, students]);
  const studentTestTypes = useMemo(() => selectedStudent?.['Test Types'] || [], [selectedStudent]);
  // For now, we'll base the dialog on the *first* test type. This should be improved.
  const primaryTestType = useMemo(() => studentTestTypes[0], [studentTestTypes]);

  const month = watch('month');
  const year = watch('year');

  const daysInMonth = useMemo(() => {
    if (month && year) {
        return new Date(parseInt(year), parseInt(month) + 1, 0).getDate();
    }
    return 31;
  }, [month, year]);
  
  const dayOptions = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());


  const filteredPracticeTests = useMemo(() => {
    if (!primaryTestType) return [];
    return assignments.filter(a => a.isPracticeTest && a['Test Type'] === primaryTestType);
  }, [primaryTestType, assignments]);

  const currentTestConfig = useMemo(() => {
    if (!primaryTestType) return null;
    return TEST_CONFIG[primaryTestType];
  }, [primaryTestType]);
  
  const isStanineTest = useMemo(() => primaryTestType?.includes('ISEE'), [primaryTestType]);

  useEffect(() => {
    if (studentId) {
        const student = students.find(s => s.id === studentId);
        const testType = student?.['Test Types']?.[0] || '';
        const config = TEST_CONFIG[testType];
        
        reset({
            studentId: studentId,
            testTypeSelection: 'Practice Test',
            practiceTestId: '',
            officialTestName: '',
            month: (new Date().getMonth()).toString(),
            year: new Date().getFullYear().toString(),
            day: '',
            scores: config ? config.sections.map((s: any) => ({ section: s.name, score: s.default })) : [],
        });
        setValue('testTypeSelection', 'Practice Test');
    } else {
        reset({
          studentId: '',
          testTypeSelection: '',
          officialTestName: '',
          practiceTestId: '',
          month: (new Date().getMonth()).toString(),
          year: new Date().getFullYear().toString(),
          day: '',
          scores: [],
        });
    }
  }, [studentId, students, reset, setValue]);
  
  useEffect(() => {
    if (testTypeSelection.startsWith('Official') && month && year) {
        const monthName = MONTHS.find(m => m.value === month)?.name;
        setValue('officialTestName', `${monthName} ${year} ${primaryTestType}`);
    }
  }, [testTypeSelection, month, year, primaryTestType, setValue]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!primaryTestType) {
        toast({ title: 'Error', description: 'Could not determine test type for student.', variant: 'destructive'});
        return;
    }

    setIsSubmitting(true);
    try {
      const monthIndex = parseInt(values.month, 10);
      const yearInt = parseInt(values.year, 10);
      const dayInt = values.day ? parseInt(values.day, 10) : 15; // Default to middle of month if no day
      const testDate = new Date(yearInt, monthIndex, dayInt);

      const isOfficial = values.testTypeSelection !== 'Practice Test';
      
      const assignmentId = isOfficial ? values.officialTestName : values.practiceTestId;
      
      const payload = {
        studentId: values.studentId,
        testType: primaryTestType,
        assignmentId: assignmentId!,
        testDate,
        scores: values.scores || [],
        isOfficial: isOfficial,
      };

      await handleAddTestScore(payload);
      onScoreAdd();

      toast({
        title: 'Score Added',
        description: 'The test score has been successfully recorded.',
      });
      setOpen(false);
      form.reset();
    } catch (error: any) {
      console.error("Error in onSubmit:", error);
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
      <DialogContent className="sm:max-w-[600px] max-h-[90svh] p-0">
        <div className="flex flex-col max-h-[90svh]">
            <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
                <DialogTitle>Add New Test Score</DialogTitle>
                <DialogDescription>
                Record an official or practice test score for a student.
                </DialogDescription>
            </DialogHeader>
            
            <div className="px-6 flex-1 min-h-0">
                <div className="max-h-full overflow-y-auto -mx-6 px-6">
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
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
                                <SelectContent 
                                    position="popper" 
                                    side="bottom"
                                    align="start"
                                    className="w-[var(--radix-select-trigger-width)] max-h-[200px]"
                                >
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

                        {studentId && primaryTestType && (
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
                                    <SelectItem value={`Official ${primaryTestType}`}>{`Official ${primaryTestType}`}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />

                            {testTypeSelection === 'Practice Test' ? (
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
                                    <SelectContent 
                                        position="popper"
                                        side="bottom"
                                        align="start"
                                        className="w-[var(--radix-select-trigger-width)] max-h-[200px]"
                                    >
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
                            ) : null}

                            <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="month"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Month</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Month" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        {MONTHS.map((month) => (
                                            <SelectItem key={month.value} value={month.value}>{month.name}</SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField
                                    control={form.control}
                                    name="day"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Day (Opt.)</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                            <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Day" />
                                            </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                            {dayOptions.map(day => (
                                                <SelectItem key={day} value={day}>{day}</SelectItem>
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
                                            <SelectValue placeholder="Year" />
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
                                                name={`scores.${index}`}
                                                defaultValue={{ section: section.name, score: section.default }}
                                                render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center justify-between">
                                                        <FormLabel>{section.name}</FormLabel>
                                                        {isStanineTest && field.value?.score > 0 && (
                                                            <span className="text-sm font-medium text-muted-foreground">
                                                            Stanine: {getStanine(field.value.score)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <FormControl>
                                                        <Stepper
                                                            value={field.value?.score || section.default}
                                                            onValueChange={(newScore) => {
                                                                field.onChange({
                                                                    section: section.name,
                                                                    score: newScore
                                                                });
                                                            }}
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
                        </form>
                    </Form>
                </div>
            </div>
            
            <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
                <DialogClose asChild>
                    <Button type="button" variant="ghost">Cancel</Button>
                </DialogClose>
                <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Score
                </Button>
            </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
