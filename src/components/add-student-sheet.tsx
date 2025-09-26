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
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addStudent } from '@/lib/students';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/hooks/use-user-role';
import { getAllTutors } from '@/lib/user-management';
import type { User } from '@/lib/user-roles';

const studentSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().trim().email({ message: 'Please enter a valid email address.' }),
  parentEmail1: z.string().trim().email({ message: 'Please enter a valid email.' }).optional().or(z.literal('')),
  parentEmail2: z.string().trim().email({ message: 'Please enter a valid email.' }).optional().or(z.literal('')),
  testTypes: z.array(z.string()).min(1, { message: 'Please select a test type.' }),
  upcomingTestDate: z.string().optional(),
  Rate: z.coerce.number().optional(),
  Frequency: z.string().optional(),
  timeZone: z.string().optional().or(z.literal('')),
  profile: z.string().optional(),
  tutorId: z.string().min(1, { message: 'Please select a tutor.' }),
});

export function AddStudentSheet() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tutors, setTutors] = useState<User[]>([]);
  const [tutorsLoading, setTutorsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const { isAdmin, user: currentUser } = useUserRole();

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
      tutorId: currentUser?.uid || '', // Default to current user for non-admins
    },
  });

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

  // Set default tutor for non-admins
  useEffect(() => {
    if (!isAdmin && currentUser) {
      form.setValue('tutorId', currentUser.uid);
    }
  }, [isAdmin, currentUser, form]);

  async function onSubmit(values: z.infer<typeof studentSchema>) {
    setIsSubmitting(true);
    try {
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
        tutorId: values.tutorId, // Add tutorId to student data
      };
      
      // Remove undefined keys
      Object.keys(studentData).forEach(key => {
        if (studentData[key as keyof typeof studentData] === undefined) {
          delete studentData[key as keyof typeof studentData];
        }
      });

      await addStudent(studentData as any);

      const selectedTutor = tutors.find(t => t.uid === values.tutorId);
      const tutorName = selectedTutor ? selectedTutor.displayName : 'tutor';

      toast({
        title: 'Student Added',
        description: `${values.name} has been successfully added to ${tutorName}'s roster.`,
      });
      router.refresh();
      form.reset();
      setOpen(false);

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

  // Only admins can add students
  if (!isAdmin) {
    return null;
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
            Fill out the form below to add a new student and assign them to a tutor.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-6 space-y-4"
          >
            {/* Tutor Selection - Only for Admins */}
            <FormField
              control={form.control}
              name="tutorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign to Tutor</FormLabel>
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
                    Choose which tutor this student will be assigned to.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormLabel>Parent's Email (Optional)</FormLabel>
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
            
            <FormField
              control={form.control}
              name="parentEmail2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent's Email 2 (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., another.parent@example.com"
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
              name="testTypes"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Test Types</FormLabel>
                    <FormDescription>
                      Select all test types this student will be preparing for.
                    </FormDescription>
                  </div>
                  {['SAT', 'ACT', 'SSAT', 'Upper Level ISEE', 'Middle Level ISEE', 'Lower Level ISEE'].map((testType) => (
                    <FormField
                      key={testType}
                      control={form.control}
                      name="testTypes"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={testType}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(testType)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, testType])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== testType
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {testType}
                            </FormLabel>
                          </FormItem>
                        )
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
                  <FormLabel>Upcoming Test Date (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="Rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hourly Rate (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 150"
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
                name="Frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Frequency (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Weekly"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="timeZone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Zone (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time zone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ET">Eastern Time (ET)</SelectItem>
                      <SelectItem value="CT">Central Time (CT)</SelectItem>
                      <SelectItem value="MT">Mountain Time (MT)</SelectItem>
                      <SelectItem value="PT">Pacific Time (PT)</SelectItem>
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
                  <FormLabel>Student Profile (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes about the student..."
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
                <Button variant="ghost">Cancel</Button>
              </SheetClose>
              <Button type="submit" disabled={isSubmitting || tutorsLoading}>
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