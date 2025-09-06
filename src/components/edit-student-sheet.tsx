
'use client';

import { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateStudent } from '@/lib/students';
import { useData } from '@/context/data-provider';
import type { Student } from '@/lib/types';

interface EditStudentSheetProps {
  student: Student;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const studentSchema = z.object({
  'Student Name': z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  'Student Email': z.string().trim().email({ message: 'Please enter a valid email address.' }),
  'Parent Email 1': z.string().trim().email({ message: 'Please enter a valid email.' }).optional().or(z.literal('')),
  'Parent Email 2': z.string().trim().email({ message: 'Please enter a valid email.' }).optional().or(z.literal('')),
  'Test Type': z.string().min(1, { message: 'Please select a test type.' }),
  'Upcoming Test Date': z.string().optional(),
  profile: z.string().optional(),
});


export function EditStudentSheet({ student, isOpen, onOpenChange }: EditStudentSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { refetchData } = useData();

  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      'Student Name': student['Student Name'] || '',
      'Student Email': student['Student Email'] || '',
      'Parent Email 1': student['Parent Email 1'] || '',
      'Parent Email 2': student['Parent Email 2'] || '',
      'Test Type': student['Test Type'] || '',
      'Upcoming Test Date': student['Upcoming Test Date'] || '',
      profile: student.profile || '',
    },
  });

  useEffect(() => {
    form.reset({
      'Student Name': student['Student Name'] || student.name || '',
      'Student Email': student['Student Email'] || student.email || '',
      'Parent Email 1': student['Parent Email 1'] || student.parentEmail1 || '',
      'Parent Email 2': student['Parent Email 2'] || student.parentEmail2 || '',
      'Test Type': student['Test Type'] || student.testType || '',
      'Upcoming Test Date': student['Upcoming Test Date'] || student.upcomingTestDate || '',
      profile: student.profile || '',
    });
  }, [student, form]);

  async function onSubmit(values: z.infer<typeof studentSchema>) {
    setIsSubmitting(true);
    try {
      const studentData = { ...values };
      if (studentData['Parent Email 1'] === '') delete studentData['Parent Email 1'];
      if (studentData['Parent Email 2'] === '') delete studentData['Parent Email 2'];

      await updateStudent(student.id, studentData);
      toast({
        title: 'Student Updated',
        description: `${values['Student Name']} has been successfully updated.`,
      });
      refetchData();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update student. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Student</SheetTitle>
          <SheetDescription>
            Update the details for {student.name}.
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
                   <Select onValueChange={field.onChange} value={field.value}>
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
                Save Changes
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
