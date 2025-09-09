'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Submission, Student, Assignment, SubmissionStatus } from '@/lib/types';
import {
  Card,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { MoreHorizontal, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { handleUpdateSubmission } from '@/app/needs-review/actions';

type EnrichedSubmission = Submission & {
  student?: Student;
  assignment?: Assignment;
};

interface NeedsReviewClientProps {
  submissions: EnrichedSubmission[];
}

const TEST_CONFIG: any = {
  'SAT': {
    sections: ['Reading + Writing', 'Math'],
  },
  'ACT': {
    sections: ['English', 'Math', 'Reading', 'Science'],
  },
  'Upper Level SSAT': {
    sections: ['Verbal', 'Reading', 'Quantitative'],
  },
   'Middle Level SSAT': {
    sections: ['Verbal', 'Reading', 'Quantitative'],
  },
  'Upper Level ISEE': {
    sections: ['Verbal Reasoning', 'Quantitative Reasoning', 'Reading Comprehension', 'Math Achievement'],
  },
  'Middle Level ISEE': {
    sections: ['Verbal Reasoning', 'Quantitative Reasoning', 'Reading Comprehension', 'Math Achievement'],
  }
};

const scoreSchema = z.object({
  section: z.string(),
  score: z.coerce
    .number({ invalid_type_error: 'Score is required.' })
    .min(1, "Score is required.")
});

const formSchema = z.object({
  scores: z.array(scoreSchema),
});

function StatusBadge({ submission }: { submission: EnrichedSubmission }) {
  const { status, assignment } = submission;
  const isPracticeTest = assignment?.isPracticeTest;

  // Define status variants with proper typing
  const statusVariants = {
    'Assigned': 'secondary',
    'Completed': 'default',
    'Incomplete': 'destructive',
    'Did Together': 'outline',
  } as const;

  type VariantType = 'secondary' | 'destructive' | 'outline' | 'default';
  const variant: VariantType = (statusVariants[status as keyof typeof statusVariants] || 'default') as VariantType;
  
  // Custom styling for Assigned Practice Tests
  if (isPracticeTest && status === 'Assigned') {
    return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Assigned</Badge>
  }

  return <Badge variant={variant}>{status}</Badge>;
}

export function NeedsReviewClient({ submissions }: NeedsReviewClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<EnrichedSubmission | null>(null);
  const { toast } = useToast();

  const sections = selectedSubmission?.assignment?.['Test Type'] ? TEST_CONFIG[selectedSubmission.assignment['Test Type']]?.sections : [];
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scores: [],
    },
  });
  
  const handleOpenDialog = (submission: EnrichedSubmission) => {
    setSelectedSubmission(submission);
    const scoreSections = submission.assignment?.['Test Type'] ? TEST_CONFIG[submission.assignment['Test Type']]?.sections : [];
    
    // Check if there are existing scores to populate the form
    const existingScoresMap = new Map(submission.scores?.map(s => [s.section, s.score]));

    form.reset({
      scores: scoreSections.map((section: string) => ({ 
        section, 
        score: existingScoresMap.get(section) || 0,
      }))
    });
    setIsDialogOpen(true);
  };

  const handleStatusChange = async (submissionId: string, status: SubmissionStatus) => {
    setIsSubmitting(true);
    try {
      const result = await handleUpdateSubmission({ submissionId, status });
      if (result.success) {
        toast({ title: 'Status Updated', description: `Assignment marked as ${status}.` });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update status.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  async function onScoreSubmit(values: z.infer<typeof formSchema>) {
    if (!selectedSubmission) return;

    setIsSubmitting(true);
    try {
      // When scores are submitted, the status is automatically updated to 'Completed'
      const result = await handleUpdateSubmission({
        submissionId: selectedSubmission.id,
        status: 'Completed',
        scores: values.scores,
      });

      if (result.success) {
        toast({ title: 'Scores Saved', description: 'The test scores have been recorded.' });
        setIsDialogOpen(false);
        setSelectedSubmission(null);
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save scores.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  const tableHeadStyle = "text-base font-semibold text-foreground";

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={cn(tableHeadStyle)}>Student</TableHead>
                <TableHead className={cn(tableHeadStyle)}>Assignment</TableHead>
                <TableHead className={cn(tableHeadStyle)}>Date</TableHead>
                <TableHead className={cn(tableHeadStyle)}>Status</TableHead>
                <TableHead className={cn(tableHeadStyle, "text-right")}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.student?.name || 'Unknown Student'}</TableCell>
                  <TableCell>{submission.assignment?.['Full Assignment Name'] || 'Unknown Assignment'}</TableCell>
                  <TableCell>{submission.submittedAt.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <StatusBadge submission={submission} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isSubmitting}>
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {submission.assignment?.isPracticeTest ? (
                           <>
                             <DropdownMenuItem onClick={() => handleOpenDialog(submission)}>Enter Scores</DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleStatusChange(submission.id, 'Incomplete')}>Mark as Incomplete</DropdownMenuItem>
                           </>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => handleStatusChange(submission.id, 'Completed')}>Mark as Completed</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(submission.id, 'Incomplete')}>Mark as Incomplete</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(submission.id, 'Did Together')}>Mark as "Did Together"</DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Scores for {selectedSubmission?.assignment?.['Full Assignment Name']}</DialogTitle>
            <DialogDescription>
              Enter the scores for each section for {selectedSubmission?.student?.name}.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onScoreSubmit)} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                {form.getValues('scores').map((_, index) => (
                    <FormField
                      key={index}
                      control={form.control}
                      name={`scores.${index}.score`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{sections[index]}</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Score" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                ))}
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Scores
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}