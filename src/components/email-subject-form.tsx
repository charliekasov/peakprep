'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import type { GenerateEmailSubjectOutput } from '@/ai/flows/generate-email-subject';
import { handleGenerateSubject } from '@/app/email-subject-generator/actions';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  studentProfile: z
    .string()
    .min(10, 'Please provide a more detailed student profile.'),
  assignmentContent: z
    .string()
    .min(10, 'Please provide more detail about the assignment.'),
  completionRate: z.coerce.number().min(0).max(100).optional(),
});

export function EmailSubjectForm() {
  const [result, setResult] = useState<GenerateEmailSubjectOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentProfile: '',
      assignmentContent: '',
      completionRate: 75,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const output = await handleGenerateSubject(values);
      setResult(output);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error Generating Subject',
        description:
          'An unexpected error occurred. Please try again later.',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="studentProfile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student Profile</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., Loves science, particularly astronomy. Visual learner. Sometimes struggles with long-form writing."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Describe the student's interests, learning style, and performance.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="assignmentContent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assignment Content</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., Write a 500-word essay analyzing symbolism in The Great Gatsby, focusing on wealth and the American Dream."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Briefly describe the assignment, its topics, and instructions.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="completionRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Past Completion Rate (Optional)</FormLabel>
                 <FormControl>
                  <div className="flex items-center gap-4">
                    <Slider
                      defaultValue={[field.value ?? 75]}
                      onValueChange={(value) => field.onChange(value[0])}
                      max={100}
                      step={1}
                    />
                    <span className="w-16 rounded-md border border-input px-2 py-1 text-center text-sm font-mono">
                      {field.value}%
                    </span>
                  </div>
                </FormControl>
                <FormDescription>
                  Estimated completion rate for similar past assignments.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Generate
          </Button>
        </form>
      </Form>

      {isLoading && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <p className="mt-4 font-semibold">Generating Ideas...</p>
            <p className="text-sm text-muted-foreground">Our AI is crafting the perfect subject line.</p>
        </div>
      )}

      {result && (
        <Card className="bg-accent/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Generated Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">Suggested Subject Line:</h3>
              <p className="mt-1 rounded-md bg-background p-3 font-mono text-sm">
                {result.subjectLine}
              </p>
            </div>
            {result.suggestedDifficulty && (
              <div>
                <h3 className="font-semibold">Suggested Difficulty:</h3>
                <p className="mt-1">{result.suggestedDifficulty}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
