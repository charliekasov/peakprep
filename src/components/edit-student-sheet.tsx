"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateStudent } from "@/lib/students";
import type { Student } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useUserRole } from "@/hooks/use-user-role";
import { getAllTutors } from "@/lib/user-management";
import type { User } from "@/lib/user-roles";

interface EditStudentSheetProps {
  student: Student;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const studentSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address." }),
  parentEmail1: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email." })
    .optional()
    .or(z.literal("")),
  parentEmail2: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email." })
    .optional()
    .or(z.literal("")),
  testTypes: z
    .array(z.string())
    .min(1, { message: "At least one test type is required." }),
  upcomingTestDate: z.string().optional(),
  Rate: z.coerce.number().optional(),
  Frequency: z.string().optional(),
  timeZone: z.string().optional().or(z.literal("")),
  profile: z.string().optional(),
  tutorId: z.string().min(1, { message: "Please select a tutor." }),
});

export function EditStudentSheet({
  student,
  isOpen,
  onOpenChange,
}: EditStudentSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tutors, setTutors] = useState<User[]>([]);
  const [tutorsLoading, setTutorsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const { isAdmin } = useUserRole();

  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      email: "",
      parentEmail1: "",
      parentEmail2: "",
      testTypes: [],
      upcomingTestDate: "",
      Rate: undefined,
      Frequency: "",
      timeZone: "",
      profile: "",
      tutorId: "",
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
        setTutors(allTutors.filter((tutor) => tutor.isActive));
      } catch (error) {
        console.error("Error loading tutors:", error);
        toast({
          title: "Error",
          description: "Failed to load tutors for selection.",
          variant: "destructive",
        });
      } finally {
        setTutorsLoading(false);
      }
    }

    loadTutors();
  }, [isAdmin, toast]);

  // Reset form when student changes
  useEffect(() => {
    if (student && isOpen) {
      form.reset({
        name: student.name || "",
        email: student.email || "",
        parentEmail1: student.parentEmail1 || "",
        parentEmail2: student.parentEmail2 || "", // Always visible, always optional
        testTypes: student.testTypes || [],
        upcomingTestDate: student.upcomingTestDate || "",
        Rate: student.Rate || undefined,
        Frequency: student.Frequency || "",
        timeZone: student.timeZone || "",
        profile: student.profile || "",
        tutorId: student.tutorId || "", // Critical: preserves tutor selection
      });
    }
  }, [student, isOpen, form]);

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
        title: "Student Updated",
        description: `${values.name} has been successfully updated.`,
      });
      router.refresh();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update student. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet key={student?.id || 'edit'} open={isOpen} onOpenChange={onOpenChange}>
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
                  {["SAT", "ACT", "SSAT", "Upper Level ISEE", "Middle Level ISEE", "Lower Level ISEE"].map((testType) => (
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
                                          (value) => value !== testType,
                                        ),
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {testType}
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
                    <Input 
                      type="number" 
                      placeholder="e.g., 100" 
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
                      placeholder="e.g., 2x per week"
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
              name="timeZone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Zone (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., EST, PST, GMT"
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
              name="profile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes/Profile (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes about this student..."
                      className="resize-none"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Student
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}