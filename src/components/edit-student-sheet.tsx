
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
import { Loader2, PlusCircle, XCircle } from 'lucide-react';
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
  'Test Types': z.array(z.string()).min(1, {message: 'At least one test type is required.'}).max(2),
  'Upcoming Test Date': z.string().optional(),
  profile: z.string().optional(),
});


const TEST_OPTIONS = ["SAT", "ACT", "Upper Level SSAT", "Middle Level SSAT", "Upper Level ISEE", "Middle Level ISEE"];

export function EditStudentSheet({ student, isOpen, onOpenChange }: EditStudentSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showParentEmail2, setShowParentEmail2] = useState(false);
  const [showTestType2, setShowTestType2] = useState(false);

  const { toast } = useToast();
  const { refetchData } = useData();

  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      'Student Name': '',
      'Student Email': '',
      'Parent Email 1': '',
      'Parent Email 2': '',
      'Test Types': [],
      'Upcoming Test Date': '',
      profile: '',
    },
  });

  useEffect(() => {
    if (student) {
      const testTypes = student['Test Types'] || (student.testType ? [student.testType] : []);
      
      form.reset({
        'Student Name': student['Student Name'] || student.name || '',
        'Student Email': student['Student Email'] || student.email || '',
        'Parent Email 1': student['Parent Email 1'] || student.parentEmail1 || '',
        'Parent Email 2': student['Parent Email 2'] || student.parentEmail2 || '',
        'Test Types': testTypes,
        'Upcoming Test Date': student['Upcoming Test Date'] || student.upcomingTestDate || '',
        profile: student.profile || '',
      });

      setShowParentEmail2(!!(student['Parent Email 2'] || student.parentEmail2));
      setShowTestType2(testTypes.length > 1);

    }
  }, [student, form, isOpen]);

  async function onSubmit(values: z.infer<typeof studentSchema>) {
    setIsSubmitting(true);
    try {
      const studentData: any = { ...values };
      if (studentData['Parent Email 1'] === '') delete studentData['Parent Email 1'];
      if (studentData['Parent Email 2'] === '') delete studentData['Parent Email 2'];

      // Filter out any empty strings from test types
      studentData['Test Types'] = studentData['Test Types'].filter(Boolean);

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
  
  const currentTestTypes = form.watch('Test Types') || [];

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
                  <FormLabel>Parent's Email</FormLabel>
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
            {showParentEmail2 ? (
                <FormField
                control={form.control}
                name="Parent Email 2"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Parent's Email 2</FormLabel>
                    <div className="flex items-center gap-2">
                        <FormControl>
                            <Input placeholder="e.g., another.parent@example.com" {...field} />
                        </FormControl>
                        <Button variant="ghost" size="icon" type="button" onClick={() => {
                            setShowParentEmail2(false);
                            form.setValue('Parent Email 2', '');
                        }}>
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />
            ) : (
                <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setShowParentEmail2(true)}>
                    <PlusCircle className="mr-2 h-3 w-3" />
                    Add Parent Email
                </Button>
            )}

            <div className="space-y-2">
                <FormField
                    control={form.control}
                    name="Test Types.0"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Test Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a test type" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {TEST_OPTIONS.map(opt => (
                                    <SelectItem key={opt} value={opt} disabled={currentTestTypes[1] === opt}>
                                        {opt}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                {showTestType2 ? (
                     <FormField
                        control={form.control}
                        name="Test Types.1"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Test Type 2</FormLabel>
                             <div className="flex items-center gap-2">
                                <Select onValueChange={field.onChange} value={field.value || ''}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a second test type" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                       {TEST_OPTIONS.map(opt => (
                                            <SelectItem key={opt} value={opt} disabled={currentTestTypes[0] === opt}>
                                                {opt}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                 <Button variant="ghost" size="icon" type="button" onClick={() => {
                                    setShowTestType2(false);
                                    form.setValue('Test Types', [currentTestTypes[0]]);
                                }}>
                                    <XCircle className="h-4 w-4 text-muted-foreground" />
                                </Button>
                            </div>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                ) : (
                    currentTestTypes.length < 2 &&
                    <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setShowTestType2(true)}>
                        <PlusCircle className="mr-2 h-3 w-3" />
                        Add Test Type
                    </Button>
                )}
            </div>

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
                <Button variant="ghost" type="button">Cancel</Button>
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
