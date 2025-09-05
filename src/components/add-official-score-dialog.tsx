
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { PlusCircle, Loader2, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleAddTestScore } from '@/app/test-scores/actions';
import type { Student, Assignment } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const scoreSchema = z.object({
  section: z.string(),
  score: z.coerce
    .number({ required_error: 'Score is required.' })
    .min(1, 'Score is required.'),
});

const testScoreSchema = z.object({
  studentId: z.string().min(1, 'Student is required.'),
  testType: z.string().min(1, 'Test type is required.'),
  assignmentId: z.string().optional(),
  testDate: z.date({ required_error: 'Test date is required.' }),
  scores: z.array(scoreSchema),
});

const OFFICIAL_TEST_TYPES: { [key: string]: string[] } = {
  'Official SAT': ['Reading + Writing', 'Math'],
  'Official PSAT': ['Reading + Writing', 'Math'],
  'Official SSAT': ['Verbal', 'Quantitative', 'Reading'],
};

const PRACTICE_TEST_ID = 'practice-test';

interface AddTestScoreDialogProps {
  students: Student[];
  assignments: Assignment[];
  onScoreAdded: () => void;
}

export function AddTestScoreDialog({
  students,
  assignments,
  onScoreAdded,
}: AddTestScoreDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof testScoreSchema>>({
    resolver: zodResolver(testScoreSchema),
    defaultValues: {
      studentId: '',
      testType: '',
      assignmentId: '',
      scores: [],
    },
  });

  const selectedTestType = form.watch('testType');
  const selectedAssignmentId = form.watch('assignmentId');

  const sections =
    selectedTestType === PRACTICE_TEST_ID
      ? assignments.find((a) => a.id === selectedAssignmentId)?.['Test Type'] === 'SAT' ? ['Reading + Writing', 'Math'] : ['Verbal', 'Quantitative', 'Reading']
      : OFFICIAL_TEST_TYPES[selectedTestType] || [];

  async function onSubmit(values: z.infer<typeof testScoreSchema>) {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        // Ensure we only pass the assignmentId if a practice test was selected
        assignmentId: values.testType === PRACTICE_TEST_ID ? values.assignmentId : undefined,
        // If it's a practice test, the "type" is the assignment name for the backend
        testType: values.testType === PRACTICE_TEST_ID 
          ? assignments.find(a => a.id === values.assignmentId)?.['Full Assignment Name'] 
          : values.testType,
        scores: sections.map((section, index) => ({
          section,
          score: values.scores[index].score,
        })),
      };

      await handleAddTestScore(payload);
      toast({
        title: 'Success!',
        description: 'Test score has been added.',
      });
      onScoreAdded();
      form.reset();
      setOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add score. Please try again.',
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Test Score</DialogTitle>
          <DialogDescription>
            Enter scores for an official test or an unassigned practice test.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
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
            <FormField
              control={form.control}
              name="testType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Test Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={PRACTICE_TEST_ID}>
                        Practice Test
                      </SelectItem>
                      {Object.keys(OFFICIAL_TEST_TYPES).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedTestType === PRACTICE_TEST_ID && (
              <FormField
                control={form.control}
                name="assignmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Practice Test</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a practice test" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assignments.map((assignment) => (
                          <SelectItem key={assignment.id} value={assignment.id}>
                            {assignment['Full Assignment Name']}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="testDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Test Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            {sections.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {sections.map((section, index) => (
                  <FormField
                    key={section}
                    control={form.control}
                    name={`scores.${index}.score`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{section}</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Score" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            )}
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting || !selectedTestType}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Score
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
