// Manage Tutors - List, add, and archive tutors

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/use-user-role";
import {
  ArrowLeft,
  UserPlus,
  Loader2,
  Edit,
  Archive,
  RotateCcw,
  Save,
  Users,
  Eye,       
  EyeOff,
} from "lucide-react";
import {
  createTutorAccount,
  getAllTutors,
  updateUserProfile,
  updateUserRole,
  archiveUser,
  reactivateUser,
} from "@/lib/user-management";
import {
  getRoleDisplayName,
  getRoleBadgeColor,
  UserRole,
} from "@/lib/user-roles";
import type { User } from "@/lib/user-roles";

const tutorSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(1, "Display name is required"),
  role: z.enum(["tutor", "manager_admin", "super_admin"]),
  location: z.string().optional(),
  phone: z.string().optional(),
  subjects: z.string().optional(), // Will be parsed as array
  bio: z.string().optional(),
  availability: z.string().optional(),
  experience: z.string().optional(),
  education: z.string().optional(),
  hourlyRate: z.string().optional(),
  adminNotes: z.string().optional(),
  startDate: z.string().optional(), // Will be parsed as Date
});

type TutorFormData = z.infer<typeof tutorSchema>;

export default function AdminUsersPage() {
  const { isAdmin, isSuperAdmin, isLoading, user: currentUser } = useUserRole();
  const router = useRouter();
  const { toast } = useToast();

  const [tutors, setTutors] = useState<User[]>([]);
  const [tutorsLoading, setTutorsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTutor, setEditingTutor] = useState<User | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<TutorFormData>({
    resolver: zodResolver(tutorSchema),
    defaultValues: {
      role: "tutor",
      password: "TempPass123!", // Default temporary password
    },
  });

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, isLoading, router]);

  // Load all tutors
  useEffect(() => {
    async function loadTutors() {
      try {
        const allTutors = await getAllTutors();
        setTutors(allTutors);
      } catch (error) {
        console.error("Error loading tutors:", error);
        toast({
          title: "Error",
          description: "Failed to load tutors. Please try again.",
          variant: "destructive",
        });
      } finally {
        setTutorsLoading(false);
      }
    }

    if (isAdmin) {
      loadTutors();
    }
  }, [isAdmin, toast]);

  const onSubmit = async (data: TutorFormData) => {
    if (!currentUser) return;

    setIsCreating(true);
    try {
      // Parse subjects and start date
      const subjects = data.subjects
        ? data.subjects
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

      const startDate = data.startDate ? new Date(data.startDate) : undefined;

      const profileData = {
        location: data.location,
        phone: data.phone,
        subjects,
        bio: data.bio,
        availability: data.availability,
        experience: data.experience,
        education: data.education,
        hourlyRate: data.hourlyRate,
        adminNotes: data.adminNotes,
        startDate,
      };

      // Filter out undefined values
      const cleanProfileData = Object.fromEntries(
        Object.entries(profileData).filter(([_, value]) => value !== undefined),
      );

      await createTutorAccount(
        data.email,
        data.password,
        data.displayName,
        data.role as UserRole,
        currentUser.uid,
        cleanProfileData,
      );

      // Reload tutors
      const updatedTutors = await getAllTutors();
      setTutors(updatedTutors);

      toast({
        title: "Tutor Created",
        description: `${data.displayName} has been added successfully. They can now log in with their credentials.`,
      });

      // Reset form and close dialog
      form.reset();
      setShowAddDialog(false);
    } catch (error) {
      console.error("Error creating tutor:", error);
      toast({
        title: "Error",
        description: "Failed to create tutor account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleArchiveUser = async (user: User) => {
    if (!currentUser || user.uid === currentUser.uid) return;

    try {
      await archiveUser(user.uid);

      // Update local state
      setTutors(
        tutors.map((t) => (t.uid === user.uid ? { ...t, isActive: false } : t)),
      );

      toast({
        title: "User Archived",
        description: `${user.displayName} has been archived.`,
      });
    } catch (error) {
      console.error("Error archiving user:", error);
      toast({
        title: "Error",
        description: "Failed to archive user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReactivateUser = async (user: User) => {
    try {
      await reactivateUser(user.uid);

      // Update local state
      setTutors(
        tutors.map((t) => (t.uid === user.uid ? { ...t, isActive: true } : t)),
      );

      toast({
        title: "User Reactivated",
        description: `${user.displayName} has been reactivated.`,
      });
    } catch (error) {
      console.error("Error reactivating user:", error);
      toast({
        title: "Error",
        description: "Failed to reactivate user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getInitials = (displayName: string) => {
    return displayName
      .split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Show loading or redirect for non-admins
  if (isLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading user management...</p>
        </div>
      </div>
    );
  }

  const activeTutors = tutors.filter((tutor) => tutor.isActive);
  const archivedTutors = tutors.filter((tutor) => !tutor.isActive);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="font-headline text-3xl font-bold tracking-tight">Manage Tutors</h1>
          <p className="text-muted-foreground">
            Add new tutors, edit profiles, and manage access permissions
          </p>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add New Tutor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Tutor</DialogTitle>
              <DialogDescription>
                Create a new tutor account with profile information and
                permissions.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {/* Basic Account Info */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Jane Smith" />
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
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="jane@peakprep.tech"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                <FormField
  control={form.control}
  name="password"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Temporary Password</FormLabel>
      <FormControl>
        <div className="relative">
          <Input {...field} type={showPassword ? "text" : "password"} />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </FormControl>
      <FormDescription>
        They can change this after first login
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="tutor">Tutor</SelectItem>
                            <SelectItem value="manager_admin">
                              Manager Admin
                            </SelectItem>
                            {isSuperAdmin && (
                              <SelectItem value="super_admin">
                                Super Admin
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Profile Information */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="New York, NY" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="(555) 123-4567" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="subjects"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subjects</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="SAT Math, ACT English, SSAT Verbal (comma-separated)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Brief description of background and expertise"
                          className="min-h-[80px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="5 years" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="availability"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Availability</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Weekends and evenings"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Admin-only fields */}
                {isSuperAdmin && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="hourlyRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hourly Rate</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="$75/hour" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="adminNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admin Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Internal notes for administrative use"
                              className="min-h-[60px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Tutor
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tutors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTutors.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently active accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tutors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tutors.length}</div>
            <p className="text-xs text-muted-foreground">
              All accounts created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{archivedTutors.length}</div>
            <p className="text-xs text-muted-foreground">Archived accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Tutors List */}
      <Card>
        <CardHeader>
          <CardTitle>All Tutors</CardTitle>
          <CardDescription>
            Manage tutor accounts, roles, and access permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tutorsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading tutors...</p>
            </div>
          ) : tutors.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-headline text-lg font-medium mb-2">No tutors yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first tutor account to get started
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add First Tutor
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active Tutors */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  ACTIVE TUTORS
                </h4>
                <div className="space-y-3">
                  {activeTutors.map((tutor) => (
                    <div
                      key={tutor.uid}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage
                            src={`https://picsum.photos/seed/${tutor.uid}/40/40`}
                          />
                          <AvatarFallback>
                            {getInitials(tutor.displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {tutor.displayName}
                            </span>
                            <Badge className={getRoleBadgeColor(tutor.role)}>
                              {getRoleDisplayName(tutor.role)}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {tutor.email}
                          </div>
                          {tutor.location && (
                            <div className="text-sm text-muted-foreground">
                              📍 {tutor.location}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                      <Button
  variant="outline"
  size="sm"
  onClick={() => router.push(`/admin/users/${tutor.uid}`)}
>
  <Eye className="h-4 w-4 mr-1" />
  View Profile
</Button>
                        {currentUser?.uid !== tutor.uid && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleArchiveUser(tutor)}
                          >
                            <Archive className="h-4 w-4 mr-1" />
                            Archive
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Archived Tutors */}
              {archivedTutors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    ARCHIVED TUTORS
                  </h4>
                  <div className="space-y-3">
                    {archivedTutors.map((tutor) => (
                      <div
                        key={tutor.uid}
                        className="flex items-center justify-between p-4 border rounded-lg bg-muted/30 opacity-75"
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar className="opacity-50">
                            <AvatarImage
                              src={`https://picsum.photos/seed/${tutor.uid}/40/40`}
                            />
                            <AvatarFallback>
                              {getInitials(tutor.displayName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {tutor.displayName}
                              </span>
                              <Badge variant="secondary">Archived</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {tutor.email}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReactivateUser(tutor)}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Reactivate
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
