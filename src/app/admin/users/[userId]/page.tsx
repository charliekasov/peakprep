// Tutor Profile - View and edit individual tutor profiles

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Save, X, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/use-user-role";
import {
  getUserById,
  updateUserProfile,
  updateUserRole,
  archiveUser,
} from "@/lib/user-management";
import {
  getRoleDisplayName,
  getRoleBadgeColor,
  UserRole,
} from "@/lib/user-roles";
import type { User } from "@/lib/user-roles";

const profileSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  role: z.enum(["tutor", "manager_admin", "super_admin"]),
  location: z.string().optional(),
  phone: z.string().optional(),
  subjects: z.string().optional(),
  bio: z.string().optional(),
  availability: z.string().optional(),
  experience: z.string().optional(),
  education: z.string().optional(),
  hourlyRate: z.string().optional(),
  adminNotes: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function AdminUserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const { toast } = useToast();
  const { user: currentUser, isSuperAdmin } = useUserRole();

  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  console.log("🐛 Component rendered with:", {
    userId,
    currentUser: currentUser?.uid,
    targetUser: targetUser?.displayName,
    isLoading,
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      role: "tutor",
      location: "",
      phone: "",
      subjects: "",
      bio: "",
      availability: "",
      experience: "",
      education: "",
      hourlyRate: "",
      adminNotes: "",
    },
  });

  // Load target user's profile
  useEffect(() => {
    async function loadUserProfile() {
      console.log("🐛 loadUserProfile called:", {
        userId,
        currentUserExists: !!currentUser,
        currentUserId: currentUser?.uid,
      });

      if (!userId || !currentUser) {
        console.log("🐛 Early return - missing data:", {
          hasUserId: !!userId,
          hasCurrentUser: !!currentUser,
        });
        return;
      }

      console.log("🐛 About to setIsLoading(true)");
      setIsLoading(true);

      try {
        console.log("🐛 Calling getUserById with:", userId);
        const user = await getUserById(userId);
        console.log(
          "🐛 getUserById returned:",
          user ? "User found" : "No user found",
        );

        if (!user) {
          console.log("🐛 User not found, showing toast and redirecting");
          toast({
            title: "User Not Found",
            description: "The requested user could not be found.",
            variant: "destructive",
          });
          router.push("/admin/users");
          return;
        }

        console.log("🐛 Setting target user and resetting form");
        setTargetUser(user);
        resetFormWithUserData(user);
        console.log("🐛 User data set successfully");
      } catch (error) {
        console.error("🐛 Error in loadUserProfile:", error);
        toast({
          title: "Error",
          description: "Failed to load user profile.",
          variant: "destructive",
        });
        router.push("/admin/users");
      } finally {
        console.log("🐛 Setting isLoading to false");
        setIsLoading(false);
      }
    }

    console.log("🐛 useEffect triggered, calling loadUserProfile");
    loadUserProfile();
  }, [userId, currentUser]);

  const resetFormWithUserData = (user: User) => {
    form.reset({
      displayName: user.displayName || "",
      role: user.role,
      location: user.location || "",
      phone: user.phone || "",
      subjects: user.subjects?.join(", ") || "",
      bio: user.bio || "",
      availability: user.availability || "",
      experience: user.experience || "",
      education: user.education || "",
      hourlyRate: user.hourlyRate || "",
      adminNotes: user.adminNotes || "",
    });
  };

  const handleEdit = () => {
    if (targetUser) {
      resetFormWithUserData(targetUser);
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (targetUser) {
      resetFormWithUserData(targetUser);
    }
  };

  const handleArchive = async () => {
    if (!targetUser) return;

    setIsArchiving(true);
    try {
      await archiveUser(targetUser.uid);
      toast({
        title: "User Archived",
        description: `${targetUser.displayName} has been archived successfully.`,
      });
      router.push("/admin/users");
    } catch (error) {
      console.error("Error archiving user:", error);
      toast({
        title: "Error",
        description: "Failed to archive user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!currentUser || !targetUser) return;

    setIsSaving(true);
    try {
      // Update role if it changed
      if (data.role !== targetUser.role) {
        await updateUserRole(targetUser.uid, data.role as UserRole);
      }

      // Parse subjects from comma-separated string to array
      const subjects = data.subjects
        ? data.subjects
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

      // Update profile
      await updateUserProfile(
        targetUser.uid,
        {
          displayName: data.displayName,
          location: data.location,
          phone: data.phone,
          subjects,
          bio: data.bio,
          availability: data.availability,
          experience: data.experience,
          education: data.education,
          hourlyRate: data.hourlyRate,
          adminNotes: data.adminNotes,
        },
        currentUser.uid,
      );

      toast({
        title: "Profile Updated",
        description: `${data.displayName}'s profile has been updated successfully.`,
      });

      // Refresh the user data and exit edit mode
      const updatedUser = await getUserById(targetUser.uid);
      if (updatedUser) {
        setTargetUser(updatedUser);
        resetFormWithUserData(updatedUser);
      }

      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
          <Button onClick={() => router.push("/admin/users")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to User Management
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/users")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{targetUser.displayName}</h1>
          <p className="text-muted-foreground">{targetUser.email}</p>
        </div>
        <Badge className={getRoleBadgeColor(targetUser.role)}>
          {getRoleDisplayName(targetUser.role)}
        </Badge>
      </div>

      {/* Action Buttons */}
      {!isEditing && (
        <div className="flex gap-2">
          <Button onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
          <Button
            variant="destructive"
            onClick={handleArchive}
            disabled={isArchiving}
          >
            {isArchiving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Trash2 className="mr-2 h-4 w-4" />
            Archive User
          </Button>
        </div>
      )}

      {/* View Mode */}
      {!isEditing && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  Name:
                </dt>
                <dd className="col-span-2 text-sm">
                  {targetUser.displayName || "Not set"}
                </dd>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  Email:
                </dt>
                <dd className="col-span-2 text-sm">{targetUser.email}</dd>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  Location:
                </dt>
                <dd className="col-span-2 text-sm">
                  {targetUser.location || "Not set"}
                </dd>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  Phone:
                </dt>
                <dd className="col-span-2 text-sm">
                  {targetUser.phone || "Not set"}
                </dd>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  Subjects:
                </dt>
                <dd className="col-span-2 text-sm">
                  {targetUser.subjects?.length
                    ? targetUser.subjects.join(", ")
                    : "Not set"}
                </dd>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  Bio:
                </dt>
                <dd className="col-span-2 text-sm whitespace-pre-wrap">
                  {targetUser.bio || "Not set"}
                </dd>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  Experience:
                </dt>
                <dd className="col-span-2 text-sm">
                  {targetUser.experience || "Not set"}
                </dd>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  Education:
                </dt>
                <dd className="col-span-2 text-sm">
                  {targetUser.education || "Not set"}
                </dd>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  Availability:
                </dt>
                <dd className="col-span-2 text-sm">
                  {targetUser.availability || "Not set"}
                </dd>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  Hourly Rate:
                </dt>
                <dd className="col-span-2 text-sm">
                  {targetUser.hourlyRate || "Not set"}
                </dd>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  Admin Notes:
                </dt>
                <dd className="col-span-2 text-sm whitespace-pre-wrap">
                  {targetUser.adminNotes || "No notes"}
                </dd>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-1">
                <dt className="text-sm font-medium text-muted-foreground">
                  Created:
                </dt>
                <dd className="col-span-2 text-sm">
                  {targetUser.createdDate?.toLocaleDateString()} by{" "}
                  {targetUser.createdBy === targetUser.uid ? "Self" : "Admin"}
                </dd>
              </div>
              {targetUser.profileLastUpdated && (
                <>
                  <Separator />
                  <div className="grid grid-cols-3 gap-1">
                    <dt className="text-sm font-medium text-muted-foreground">
                      Last Updated:
                    </dt>
                    <dd className="col-span-2 text-sm">
                      {targetUser.profileLastUpdated.toLocaleDateString()}
                    </dd>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Mode */}
      {isEditing && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
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
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
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

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., New York, NY" />
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
                        <Input {...field} placeholder="Contact number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="subjects"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subjects</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="SAT Math, ACT English (comma-separated)"
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
                        <Textarea {...field} className="min-h-[80px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="education"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Education</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                          placeholder="e.g., Weekdays evenings"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Admin Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hourly Rate</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., $75/hour" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adminNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="min-h-[60px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
