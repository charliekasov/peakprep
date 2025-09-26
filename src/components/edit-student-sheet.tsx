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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, PlusCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateStudent } from '@/lib/students';
import type { Student } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/hooks/use-user-role';
import { getAllTutors } from '@/lib/user-management';
import type { User } from '@/lib/user-roles';

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
  testTypes: z.array(z.string()).min(1, { message: 'At least one test type is required.' }),
  upcomingTestDate: z.string().optional(),
  Rate: z.coerce.number().optional(),
  Frequency: z.string().optional(),
  timeZone: z.string().optional().or(z.literal('')),
  profile: z.string().optional(),
  tutorId: z.string().min(1, { message: 'Please select a tutor.' }),
});

// Helper function to get field value with backward compatibility
function getFieldValue(student: Student, cleanName: string, legacyName: string): string {
  // Try clean name first, then legacy name, then empty string
  const cleanValue = (student as any)[cleanName];
  const legacyValue = (student as any)[legacyName];
  return cleanValue || legacyValue || '';
}

export function EditStudentSheet({ student, isOpen, onOpenChange }: EditStudentSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showParentEmail2, setShowParentEmail2] = useState(false);
  const [tutors, setTutors] = useState<User[]>([]);
  const [tutorsLoading, setTutorsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const { isAdmin } = useUserRole();

  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: getFieldValue(student, 'name', 'Student Name'),
      email: getFieldValue(student, 'email', 'Student Email'),
      parentEmail1: getFieldValue(student, 'parentEmail1', 'Parent Email 1'),
      parentEmail2: getFieldValue(student, 'parentEmail2', 'Parent Email 2'),
      testTypes: student.testTypes || (student as any)['Test Types'] || [],
      upcomingTestDate: student.upcomingTestDate || (student as any)['Upcoming Test Date'] || '',
      Rate: student.Rate || 0,
      Frequency: student.Frequency || (student as any)['Frequency'] || '',
      timeZone: student.timeZone || (student as any)['Time Zone'] || '',
      profile: student.profile || (student as any)['Profile'] || '',
      tutorId: (student as any).tutorId || '',
    },
  });

  // Reset form when student changes OR when tutors finish loading
  useEffect(() => {
    if (student && isOpen && (!isAdmin || !tutorsLoading)) {
      const formValues = {
        name: getFieldValue(student, 'name', 'Student Name'),
        email: getFieldValue(student, 'email', 'Student Email'),
        parentEmail1: getFieldValue(student, 'parentEmail1', 'Parent Email 1'),
        parentEmail2: getFieldValue(student, 'parentEmail2', 'Parent Email 2'),
        testTypes: student.testTypes || (student as any)['Test Types'] || [],
        upcomingTestDate: student.upcomingTestDate || (student as any)['Upcoming Test Date'] || '',
        Rate: student.Rate || 0,
        Frequency: student.Frequency || (student as any)['Frequency'] || '',
        timeZone: student.timeZone || (student as any)['Time Zone'] || '',
        profile: student.profile || (student as any)['Profile'] || '',
        tutorId: (student as any).tutorId || '',
      };
      
      form.reset(formValues);
    }
  }, [student, isOpen, form, isAdmin, tutorsLoading]);

  // Load tutors for admin dropdown
  useEffect(() => {
    async function loadTutors() {
      if (!isAdmin) {
        setTutorsLoading(false);
        return;
      }
      
      try {
        const allTutors = await getAllTutors();
        setTutors(allTutors.filter(tutor => tutor.isActive));
      } catch (error) {
        console.error('Error loading tutors:', error);
        toast({
          title: 'Error',
          description: 'Failed to load tutors for selection.',
          variant: 'destructive',
        });
      } finally {
        setTutorsLoading(false);
      }
    }

    loadTutors();
  }, [isAdmin, toast]);

  // Check if we should show parent email 2 field
  useEffect(() => {
    const parentEmail2Value = getFieldValue(student, 'parentEmail2', 'Parent Email 2');
    setShowParentEmail2(!!parentEmail2Value);
  }, [student]);

  const handleAddParentEmail2 = () => {
    setShowParentEmail2(true);
  };

  const handleRemoveParentEmail2 = () => {
    setShowParentEmail2(false);
    form.setValue('parentEmail2', '');
  };

  async function onSubmit(values: z.infer<typeof studentSchema>) {
    setIsSubmitting(true);
    try {
      // Map form fields to clean Firestore field names
      const studentData = {
        name: values.name,
        email: values.email,
        parentEmail1: values.parentEmail1 || undefined,
        parentEmail2: values.parentEmail2 || undefined,
        testTypes: values.testTypes,
        upcomingTestDate: values.upcomingTestDate || undefined,
        Rate: values.Rate,
        Frequency: values.Frequency || undefined,
        timeZone: values.timeZone || undefined,
        profile: values.profile || undefined,
        tutorId: values.tutorId,
      };

      // Remove undefined keys to avoid Firestore issues
      Object.keys(studentData).forEach(key => {
        if (studentData[key as keyof typeof studentData] === undefined) {
          delete studentData[key as keyof typeof studentData];
        }
      });

      await updateStudent(student.id, studentData);

      const selectedTutor = tutors.find(t => t.uid === values.tutorId);
      const tutorName = selectedTutor ? selectedTutor.displayName : 'selected tutor';

      toast({
        title: 'Student Updated',
        description: `${values.name} has been successfully updated and assigned to ${tutorName}.`,
      });
      
      // Close dialog first, then refresh - this helps with state management
      onOpenChange(false);
      router.refresh();
    } catch (error: any) {
      console.error('Error updating student:', error);
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
            {/* Tutor Selection - Only for Admins */}
            {isAdmin && (
              <FormField
                control={form.control}
                name="tutorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Tutor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={tutorsLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={tutorsLoading ? "Loading tutors..." : "Select a tutor"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tutors.map((tutor) => (
                          <SelectItem key={tutor.uid} value={tutor.uid}>
                            {tutor.displayName} ({tutor.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose which tutor this student is assigned to.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
                        <Input 
                          placeholder="e.g., another.parent@example.com" 
                          {...field} 
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveParentEmail2}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddParentEmail2}
                className="flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Add Second Parent Email
              </Button>
            )}

            <FormField
              control={form.control}
              name="testTypes"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Test Types</FormLabel>
                    <FormDescription>
                      Select all the test types this student is preparing for.
                    </FormDescription>
                  </div>
                  {['SAT', 'ACT', 'PSAT', 'AP', 'IB', 'Other'].map((item) => (
                    <FormField
                      key={item}
                      control={form.control}
                      name="testTypes"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={item}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, item])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== item
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {item}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="upcomingTestDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upcoming Test Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                    <Input
                      type="number"
                      placeholder="e.g., 75"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
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
                  <FormLabel>Session Frequency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="As needed">As needed</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <FormControl>
                    <Input placeholder="e.g., EST, PST, GMT+1" {...field} />
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
                      placeholder="Add any notes about the student's learning style, goals, or preferences..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <SheetFooter className="flex gap-2 pt-6">
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </SheetClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Student
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}