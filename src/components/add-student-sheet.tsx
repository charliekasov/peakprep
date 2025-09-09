
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addStudentAction } from '@/app/students/actions';

const studentSchema = z.object({
  'Student Name': z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  'Student Email': z.string().trim().email({ message: 'Please enter a valid email address.' }),
  'Parent Email 1': z.string().trim().email({ message: 'Please enter a valid email.' }).optional().or(z.literal('')),
  'Parent Email 2': z.string().trim().email({ message: 'Please enter a valid email.' }).optional().or(z.literal('')),
  'Test Type': z.string().min(1, { message: 'Please select a test type.' }),
  'Upcoming Test Date': z.string().optional(),
  'Rate': z.coerce.number().optional(),
  'Frequency': z.string().optional(),
  timeZone: z.string().optional(),
  profile: z.string().optional(),
});


export function AddStudentSheet() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      'Student Name': '',
      'Student Email': '',
      'Parent Email 1': '',
      'Parent Email 2': '',
      'Test Type': '',
      'Upcoming Test Date': '',
      'Rate': undefined,
      'Frequency': '',
      timeZone: '',
      profile: '',
    },
  });

  async function onSubmit(values: z.infer<typeof studentSchema>) {
    setIsSubmitting(true);
    try {
      const submissionData = { ...values };
      if (submissionData['Parent Email 1'] === '') delete submissionData['Parent Email 1'];
      if (submissionData['Parent Email 2'] === '') delete submissionData['Parent Email 2'];

      // Map to old field names for backwards compatibility if needed, though lib handles it
      const studentData = {
          name: submissionData['Student Name'],
          email: submissionData['Student Email'],
          parentEmail1: submissionData['Parent Email 1'],
          parentEmail2: submissionData['Parent Email 2'],
          testType: submissionData['Test Type'],
          upcomingTestDate: submissionData['Upcoming Test Date'],
          ...submissionData,
      };

      const result = await addStudentAction(studentData);

      if (result.success) {
        toast({
          title: 'Student Added',
          description: `${values['Student Name']} has been successfully added.`,
        });
        form.reset();
        setOpen(false);
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add student. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Student
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add New Student</SheetTitle>
          <SheetDescription>
            Fill out the form below to add a new student to your roster.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-6 space-y-4"
          >
            <FormField
              control={form.control}
              name="Student Name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="Student Email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., john.doe@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="Parent Email 1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent's Email 1 (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., jane.doe@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="Parent Email 2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent's Email 2 (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., another.parent@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="Test Type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Test Type</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a test type" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="SAT">SAT</SelectItem>
                            <SelectItem value="ACT">ACT</SelectItem>
                            <SelectItem value="Upper Level SSAT">Upper Level SSAT</SelectItem>
                            <SelectItem value="Middle Level SSAT">Middle Level SSAT</SelectItem>
                            <SelectItem value="Upper Level ISEE">Upper Level ISEE</SelectItem>
                            <SelectItem value="Middle Level ISEE">Middle Level ISEE</SelectItem>
                        </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="Upcoming Test Date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upcoming Test Date (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., August 24, 2024"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="Rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hourly Rate ($)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="Frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Days/Times</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Tuesdays at 4pm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timeZone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Zone</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a time zone (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="ET-3">Pacific Time (ET-3)</SelectItem>
                        <SelectItem value="ET-2">Mountain Time (ET-2)</SelectItem>
                        <SelectItem value="ET-1">Central Time (ET-1)</SelectItem>
                        <SelectItem value="ET">Eastern Time (NY)</SelectItem>
                        <SelectItem value="ET+5">UK / Portugal (ET+5)</SelectItem>
                        <SelectItem value="ET+6">France / Scandinavia (ET+6)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="profile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student Profile</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the student's strengths, weaknesses, and learning style."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This will help tailor assignments and communication.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter className="mt-6 pt-6">
              <SheetClose asChild>
                <Button variant="ghost">Cancel</Button>
              </SheetClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Student
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
