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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/use-user-role";
import {
  ArrowLeft,
  UserPlus,
  Loader2,
  Archive,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  getAllTutors,
  updateUserProfile,
  updateUserRole,
  archiveUser,
  reactivateUser,
} from "@/lib/user-management";
import { createTutorWithFunction } from '@/lib/user-management-functions';
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
  subjects: z.string().optional(),
  bio: z.string().optional(),
});

type TutorFormData = z.infer<typeof tutorSchema>;

export default function ManageTutorsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAdmin, isLoading } = useUserRole();
  const [tutors, setTutors] = useState<User[]>([]);
  const [tutorsLoading, setTutorsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState<"active_tutors" | "active_admins" | "archived">("active_tutors");

  const form = useForm<TutorFormData>({
    resolver: zodResolver(tutorSchema),
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
      role: "tutor",
      location: "",
      phone: "",
      subjects: "",
      bio: "",
    },
  });

  useEffect(() => {
    loadTutors();
  }, []);

  const loadTutors = async () => {
    try {
      setTutorsLoading(true);
      const allTutors = await getAllTutors();
      setTutors(allTutors);
    } catch (error) {
      console.error("Error loading tutors:", error);
      toast({
        title: "Error",
        description: "Failed to load tutors. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setTutorsLoading(false);
    }
  };

  const onSubmit = async (data: TutorFormData) => {
    if (!user) return;
    try {
      const subjectsArray = data.subjects
        ? data.subjects.split(",").map((s) => s.trim())
        : [];
  
        const profileData = {
          location: data.location,
          phone: data.phone,
          subjects: subjectsArray, // Note: using subjectsArray, not data.subjects
          bio: data.bio,
        };
    
        // Filter out undefined values
        const cleanProfileData = Object.fromEntries(
          Object.entries(profileData).filter(([_, value]) => value !== undefined && value !== "")
        );

        await createTutorWithFunction({
          email: data.email,
          password: data.password,
          displayName: data.displayName,
          role: data.role as UserRole,
          createdBy: user.uid,
          profileData: cleanProfileData,
        });
  
      toast({
        title: "Success",
        description: `Tutor account created for ${data.displayName}`,
      });
  
      form.reset();
      setShowAddDialog(false);
      loadTutors();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create tutor account",
        variant: "destructive",
      });
    }
  };

  const handleArchiveUser = async (user: User) => {
    try {
      await archiveUser(user.uid);
      setTutors(
        tutors.map((t) =>
          t.uid === user.uid ? { ...t, isActive: false } : t
        )
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
      setTutors(
        tutors.map((t) => (t.uid === user.uid ? { ...t, isActive: true } : t))
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

  // Filter tutors based on view
  const activeTutors = tutors.filter(
    (t) => t.isActive && t.role === "tutor"
  );
  const activeAdmins = tutors.filter(
    (t) => t.isActive && (t.role === "manager_admin" || t.role === "super_admin")
  );
  const archivedUsers = tutors.filter((t) => !t.isActive);

  // Get filtered list based on current view
  const filteredTutors =
    view === "active_tutors"
      ? activeTutors
      : view === "active_admins"
      ? activeAdmins
      : archivedUsers;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Manage Tutors
          </h1>
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
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="John Doe" />
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="john@example.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temporary Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                          />
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
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="tutor">Tutor</SelectItem>
                          <SelectItem value="manager_admin">
                            Manager Admin
                          </SelectItem>
                          <SelectItem value="super_admin">
                            Super Admin
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="City, State" />
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
                        <FormLabel>Phone</FormLabel>
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
                          placeholder="Math, Science, English (comma-separated)"
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
                          placeholder="Brief professional biography..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Account
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Card with Inline Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardDescription>
                Manage tutor accounts, roles, and access permissions
              </CardDescription>
            </div>
          </div>
          <Tabs
            value={view}
            onValueChange={(value) => setView(value as any)}
            className="pt-4"
          >
            <TabsList>
              <TabsTrigger value="active_tutors">
                Active Tutors ({activeTutors.length})
              </TabsTrigger>
              <TabsTrigger value="active_admins">
                Active Admins ({activeAdmins.length})
              </TabsTrigger>
              <TabsTrigger value="archived">
                Archived ({archivedUsers.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {tutorsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading tutors...</p>
            </div>
          ) : filteredTutors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {view === "archived"
                  ? "No archived users"
                  : view === "active_admins"
                  ? "No active administrators"
                  : "No active tutors"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTutors.map((tutor) => (
                <div
                  key={tutor.uid}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(tutor.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{tutor.displayName}</p>
                        <Badge
                          variant="secondary"
                          className={getRoleBadgeColor(tutor.role)}
                        >
                          {getRoleDisplayName(tutor.role)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {tutor.email}
                      </p>
                      {tutor.location && (
                        <p className="text-sm text-muted-foreground">
                          📍 {tutor.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/users/${tutor.uid}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Profile
                    </Button>
                    {tutor.isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleArchiveUser(tutor)}
                      >
                        <Archive className="h-4 w-4 mr-1" />
                        Archive
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReactivateUser(tutor)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}