
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
import { useData } from '@/context/data-provider';

type EnrichedSubmission = Submission & {
  student?: Student;
  assignment?: Assignment;
};

interface NeedsReviewClientProps {
  submissions: EnrichedSubmission[];
}

const SAT_SECTIONS = ['Reading + Writing', 'Math'];
const SSAT_SECTIONS = ['Verbal', 'Quantitative 1', 'Reading', 'Quantitative 2'];

const scoreSchema = z.object({
  section: z.string(),
  score: z.coerce
    .number()
    .min(200, "Score must be at least 200.")
    .max(800, "Score cannot exceed 800.")
    .refine((val) => val % 10 === 0, {
      message: "Score must be a multiple of 10.",
    }),
});

const formSchema = z.object({
  scores: z.array(scoreSchema),
});

function StatusBadge({ submission }: { submission: EnrichedSubmission }) {
  const { status, assignment } = submission;

  const isPracticeTest = assignment?.isPracticeTest;

  const variant: 'secondary' | 'destructive' | 'outline' | 'default' = {
    'Assigned': 'secondary',
    'Completed': 'default',
    'Incomplete': 'destructive',
    'Did Together': 'outline',
  }[status];
  
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
  const { refetchData } = useData();

  const sections = selectedSubmission?.assignment?.testType === 'SAT' ? SAT_SECTIONS : SSAT_SECTIONS;
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scores: [],
    },
  });
  
  const handleOpenDialog = (submission: EnrichedSubmission) => {
    setSelectedSubmission(submission);
    const scoreSections = submission.assignment?.testType === 'SAT' ? SAT_SECTIONS : SSAT_SECTIONS;
    
    form.reset({
      scores: scoreSections.map(section => ({ section, score: 600 }))
    });
    setIsDialogOpen(true);
  };

  const handleStatusChange = async (submissionId: string, status: SubmissionStatus) => {
    setIsSubmitting(true);
    try {
      await handleUpdateSubmission({ submissionId, status });
      toast({ title: 'Status Updated', description: `Assignment marked as ${status}.` });
      refetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  async function onScoreSubmit(values: z.infer<typeof formSchema>) {
    if (!selectedSubmission) return;

    setIsSubmitting(true);
    try {
      // When scores are submitted, the status is automatically updated to 'Completed'
      await handleUpdateSubmission({
        submissionId: selectedSubmission.id,
        status: 'Completed',
        scores: values.scores,
      });
      toast({ title: 'Scores Saved', description: 'The test scores have been recorded.' });
      refetchData();
      setIsDialogOpen(false);
      setSelectedSubmission(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save scores.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  const tableHeadStyle = "text-base font-semibold text-foreground";

  return (
    <>
      <Card>
        <CardContent>
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
                  <TableCell>{submission.assignment?.title || 'Unknown Assignment'}</TableCell>
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
            <DialogTitle>Enter Scores for {selectedSubmission?.assignment?.title}</DialogTitle>
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
                            <Input type="number" step="10" placeholder="Score" {...field} />
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
