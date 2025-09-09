
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
import { updateStudentAction } from '@/app/students/actions';
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
  'Rate': z.coerce.number().optional(),
  'Frequency': z.string().optional(),
  timeZone: z.string().optional().or(z.literal('')),
  profile: z.string().optional(),
});


const TEST_OPTIONS = ["SAT", "ACT", "Upper Level SSAT", "Middle Level SSAT", "Upper Level ISEE", "Middle Level ISEE"];

export function EditStudentSheet({ student, isOpen, onOpenChange }: EditStudentSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showParentEmail2, setShowParentEmail2] = useState(false);
  const [showTestType2, setShowTestType2] = useState(false);

  const { toast } = useToast();

  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      'Student Name': '',
      'Student Email': '',
      'Parent Email 1': '',
      'Parent Email 2': '',
      'Test Types': [],
      'Upcoming Test Date': '',
      'Rate': undefined,
      'Frequency': '',
      timeZone: '',
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
        'Rate': student['Rate'],
        'Frequency': student['Frequency'] || '',
        timeZone: student.timeZone || '',
        profile: student.profile || '',
      });

      setShowParentEmail2(!!(student['Parent Email 2'] || student.parentEmail2));
      setShowTestType2(testTypes.length > 1);

    }
  }, [student, form, isOpen]);

  async function onSubmit(values: z.infer<typeof studentSchema>) {
    setIsSubmitting(true);
    try {
      // Map form values to the structure expected by Firestore
      const studentData: Partial<Student> = {
          'Student Name': values['Student Name'],
          'Student Email': values['Student Email'],
          'Test Types': values['Test Types'].filter(Boolean),
      };

      if (values['Parent Email 1']) studentData['Parent Email 1'] = values['Parent Email 1'];
      if (values['Parent Email 2']) studentData['Parent Email 2'] = values['Parent Email 2'];
      if (values['Upcoming Test Date']) studentData['Upcoming Test Date'] = values['Upcoming Test Date'];
      if (values['Rate'] !== undefined && values['Rate'] !== null) studentData['Rate'] = values['Rate'];
      if (values['Frequency']) studentData['Frequency'] = values['Frequency'];
      if (values.timeZone) studentData.timeZone = values.timeZone;
      if (values.profile) studentData.profile = values.profile;
      
      const result = await updateStudentAction(student.id, studentData);
      
      if (result.success) {
        toast({
            title: 'Student Updated',
            description: `${values['Student Name']} has been successfully updated.`,
        });
        onOpenChange(false);
      } else {
        throw new Error(result.message);
      }

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
                  <Select onValueChange={field.onChange} value={field.value || ''}>
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
