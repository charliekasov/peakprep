
'use client';

import { useState, useMemo, useEffect } from 'react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { handleUpdateTestScore } from '@/app/test-scores/actions';
import type { Student, Submission } from '@/lib/types';
import { Stepper } from '@/components/ui/stepper';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface EditScoreDialogProps {
  submission: Submission;
  student: Student;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onScoreUpdate: () => void;
}

const scoreSchema = z.object({
  section: z.string(),
  score: z.coerce.number(),
});

const formSchema = z.object({
  testDate: z.date(),
  scores: z.array(scoreSchema),
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


export function EditScoreDialog({ submission, student, isOpen, onOpenChange, onScoreUpdate }: EditScoreDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      testDate: submission.submittedAt,
      scores: submission.scores,
    },
  });

  const studentTestType = useMemo(() => student?.['Test Type'], [student]);
  const currentTestConfig = useMemo(() => {
    if (!studentTestType) return null;
    return TEST_CONFIG[studentTestType];
  }, [studentTestType]);
  
  const isStanineTest = useMemo(() => studentTestType?.includes('ISEE'), [studentTestType]);

  useEffect(() => {
    form.reset({
      testDate: submission.submittedAt,
      scores: submission.scores,
    })
  }, [submission, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const payload = {
        submissionId: submission.id,
        testDate: values.testDate,
        scores: values.scores,
      };

      await handleUpdateTestScore(payload);
      onScoreUpdate();

      toast({
        title: 'Score Updated',
        description: 'The test score has been successfully updated.',
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error in onSubmit:", error);
      toast({
        title: 'Error Updating Score',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
            <DialogTitle>Edit Test Score</DialogTitle>
            <DialogDescription>
              Update the scores for {student.name}.
            </DialogDescription>
        </DialogHeader>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
                        variant={"outline"}
                        className={cn(
                          "w-[240px] pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
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
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {currentTestConfig && (
              <div className="space-y-4 pt-4">
                  <FormLabel>Scores</FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 rounded-md border p-4">
                      {currentTestConfig.sections.map((section: any, index: number) => {
                          const existingScore = form.watch('scores')?.find(s => s.section === section.name);
                          
                          return (
                            <FormField
                                key={section.name}
                                control={form.control}
                                name={`scores.${index}`}
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
                                            value={field.value?.score ?? section.default}
                                            onValueChange={(newScore) => {
                                                const currentScores = form.getValues('scores') || [];
                                                const otherScores = currentScores.filter(s => s.section !== section.name);
                                                const newScores = [...otherScores, { section: section.name, score: newScore }];
                                                // Ensure correct order
                                                newScores.sort((a, b) => {
                                                    const sectionOrder = currentTestConfig.sections.map((s:any) => s.name);
                                                    return sectionOrder.indexOf(a.section) - sectionOrder.indexOf(b.section);
                                                });
                                                form.setValue('scores', newScores);
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
                        )})}
                  </div>
              </div>
          )}
          <DialogFooter>
              <DialogClose asChild>
                  <Button type="button" variant="ghost">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Score
              </Button>
          </DialogFooter>
        </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
