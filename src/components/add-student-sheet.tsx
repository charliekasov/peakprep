
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
import { addStudent } from '@/lib/students';
import { useRouter } from 'next/navigation';

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
});


export function AddStudentSheet() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      };
      
      // Remove undefined keys
      Object.keys(studentData).forEach(key => {
        if (studentData[key as keyof typeof studentData] === undefined) {
          delete studentData[key as keyof typeof studentData];
        }
      });

      await addStudent(studentData as any);

      toast({
        title: 'Student Added',
        description: `${values.name} has been successfully added.`,
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Test Type</FormLabel>
                   <Select onValueChange={(value) => field.onChange([value])} value={field.value?.[0] || ''}>
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
                    <Input placeholder="e.g., Tuesdays at 4pm" {...field} value={field.value ?? ''}/>
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
