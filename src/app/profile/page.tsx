'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/use-user-role';
import { useAuth } from '@/hooks/use-auth';
import { createInitialSuperAdmin, updateUserProfile } from '@/lib/user-management';
import { getRoleDisplayName, getRoleBadgeColor } from '@/lib/user-roles';

const profileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  location: z.string().optional(),
  phone: z.string().optional(),
  subjects: z.string().optional(), // Will be parsed as array
  bio: z.string().optional(),
  availability: z.string().optional(),
  experience: z.string().optional(),
  education: z.string().optional(),
  hourlyRate: z.string().optional(),
  adminNotes: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: firebaseUser } = useAuth();
  const { user: userProfile, userRole, isLoading, refreshProfile } = useUserRole();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: userProfile?.displayName || firebaseUser?.displayName || '',
      location: userProfile?.location || '',
      phone: userProfile?.phone || '',
      subjects: userProfile?.subjects?.join(', ') || '',
      bio: userProfile?.bio || '',
      availability: userProfile?.availability || '',
      experience: userProfile?.experience || '',
      education: userProfile?.education || '',
      hourlyRate: userProfile?.hourlyRate || '',
      adminNotes: userProfile?.adminNotes || '',
    },
  });

  // If user doesn't have a profile yet, they need to create one
  const needsInitialProfile = !isLoading && firebaseUser && !userProfile;

  const handleCreateInitialProfile = async () => {
    if (!firebaseUser) return;
    
    setIsCreatingProfile(true);
    try {
      await createInitialSuperAdmin(
        firebaseUser.uid,
        firebaseUser.email!,
        firebaseUser.displayName || firebaseUser.email!
      );
      
      await refreshProfile();
      
      toast({
        title: 'Profile Created',
        description: 'Your super admin profile has been created successfully.',
      });
    } catch (error) {
      console.error('Error creating initial profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to create profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!firebaseUser || !userProfile) return;

    setIsSaving(true);
    try {
      // Parse subjects from comma-separated string to array
      const subjects = data.subjects 
        ? data.subjects.split(',').map(s => s.trim()).filter(Boolean)
        : undefined;

      await updateUserProfile(
        firebaseUser.uid,
        {
          displayName: data.displayName,
          location: data.location,
          phone: data.phone,
          subjects,
          bio: data.bio,
          availability: data.availability,
          experience: data.experience,
          education: data.education,
          ...(userRole === 'super_admin' && {
            hourlyRate: data.hourlyRate,
            adminNotes: data.adminNotes,
          }),
        },
        firebaseUser.uid
      );

      await refreshProfile();

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
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

  // Show initial profile creation screen
  if (needsInitialProfile) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create Your Profile</h1>
            <p className="text-muted-foreground">
              Set up your admin profile to get started
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Initial Setup Required</CardTitle>
            <CardDescription>
              You need to create your admin profile to access all features.
              This will set you up as a Super Administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2">
                <h3 className="font-semibold">Profile Details</h3>
                <p className="text-sm text-muted-foreground">
                  <strong>Email:</strong> {firebaseUser?.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Name:</strong> {firebaseUser?.displayName || 'Not set'}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Role:</strong> Super Administrator
                </p>
              </div>
              
              <Button 
                onClick={handleCreateInitialProfile}
                disabled={isCreatingProfile}
                className="w-full"
              >
                {isCreatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Admin Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show profile editing form
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your account information and preferences
          </p>
        </div>
        {userRole && (
          <Badge className={getRoleBadgeColor(userRole)}>
            {getRoleDisplayName(userRole)}
          </Badge>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Your basic profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Your full name" />
                    </FormControl>
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
                      <Input {...field} placeholder="e.g., New York, NY or Remote" />
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
                      <Input {...field} placeholder="Your contact number" />
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
              <CardDescription>
                Your tutoring expertise and background
              </CardDescription>
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
                        placeholder="e.g., SAT Math, ACT English, SSAT Verbal (comma-separated)" 
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
                        placeholder="Brief description of your background and expertise"
                        className="min-h-[100px]"
                      />
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
                      <Input {...field} placeholder="Years of experience or background" />
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
                      <Input {...field} placeholder="Relevant education or certifications" />
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
                      <Input {...field} placeholder="e.g., Weekdays evenings, Weekends" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Admin-only fields */}
          {userRole === 'super_admin' && (
            <Card>
              <CardHeader>
                <CardTitle>Admin Settings</CardTitle>
                <CardDescription>
                  Administrative information (Admin only)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hourly Rate</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., $75/hour or Negotiable" />
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
                        <Textarea 
                          {...field} 
                          placeholder="Internal notes for administrative use"
                          className="min-h-[80px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}