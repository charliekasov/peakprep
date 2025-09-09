
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
import type { Student } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface EditStudentSheetProps {
  student: Student;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const studentSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().trim().email({ message: 'Please enter a valid email address.' }),
  parentEmail1: z.string().trim().email({ message: 'Please enter a valid email.' }).optional().or(z.literal('')),
  parentEmail2: z.string().trim().email({ message: 'Please enter a valid email.' }).optional().or(z.literal('')),
  testTypes: z.array(z.string()).min(1, {message: 'At least one test type is required.'}).max(2),
  upcomingTestDate: z.string().optional(),
  Rate: z.coerce.number().optional(),
  Frequency: z.string().optional(),
  timeZone: z.string().optional().or(z.literal('')),
  profile: z.string().optional(),
});


const TEST_OPTIONS = ["SAT", "ACT", "Upper Level SSAT", "Middle Level SSAT", "Upper Level ISEE", "Middle Level ISEE"];

export function EditStudentSheet({ student, isOpen, onOpenChange }: EditStudentSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showParentEmail2, setShowParentEmail2] = useState(false);
  const [showTestType2, setShowTestType2] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
        name: '',
        email: '',
        parentEmail1: '',
        parentEmail2: '',
        testTypes: [],
        upcomingTestDate: '',
        Rate: undefined,
        Frequency: '',
        timeZone: '',
        profile: '',
    },
  });

  useEffect(() => {
    if (student) {
      const testTypes = student.testTypes || [];
      
      form.reset({
        name: student.name || '',
        email: student.email || '',
        parentEmail1: student.parentEmail1 || '',
        parentEmail2: student.parentEmail2 || '',
        testTypes: testTypes,
        upcomingTestDate: student.upcomingTestDate || '',
        Rate: student['Rate'],
        Frequency: student['Frequency'] || '',
        timeZone: student.timeZone || '',
        profile: student.profile || '',
      });

      setShowParentEmail2(!!(student.parentEmail2));
      setShowTestType2(testTypes.length > 1);

    }
  }, [student, form, isOpen]);

  async function onSubmit(values: z.infer<typeof studentSchema>) {
    setIsSubmitting(true);
    try {
      const studentData: Partial<Student> = { ...values };

      // Clean up optional fields
      if (!studentData.parentEmail1) delete studentData.parentEmail1;
      if (!studentData.parentEmail2) delete studentData.parentEmail2;
      if (!studentData.upcomingTestDate) delete studentData.upcomingTestDate;
      if (studentData.Rate === undefined || studentData.Rate === null) delete studentData.Rate;
      if (!studentData.Frequency) delete studentData.Frequency;
      if (!studentData.timeZone) delete studentData.timeZone;
      if (!studentData.profile) delete studentData.profile;
      
      await updateStudent(student.id, studentData);
      
      toast({
            title: 'Student Updated',
            description: `${values.name} has been successfully updated.`,
      });
      router.refresh();
      onOpenChange(false);

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update student. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const currentTestTypes = form.watch('testTypes') || [];

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
              name="name"
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
              name="email"
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
              name="parentEmail1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent's Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., jane.doe@example.com"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {showParentEmail2 ? (
                <FormField
                control={form.control}
                name="parentEmail2"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Parent's Email 2</FormLabel>
                    <div className="flex items-center gap-2">
                        <FormControl>
                            <Input placeholder="e.g., another.parent@example.com" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <Button variant="ghost" size="icon" type="button" onClick={() => {
                            setShowParentEmail2(false);
                            form.setValue('parentEmail2', '');
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
                    name="testTypes.0"
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
                        name="testTypes.1"
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
                                    form.setValue('testTypes', [currentTestTypes[0]]);
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
              name="upcomingTestDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upcoming Test Date (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., August 24, 2024"
                      {...field}
                      value={field.value ?? ''}
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
                    <Input type="number" placeholder="e.g., 100" {...field} value={field.value ?? ''} />
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
                    <Input placeholder="e.g., Tuesdays at 4pm" {...field} value={field.value ?? ''} />
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
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
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
                      value={field.value ?? ''}
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
