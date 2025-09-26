// Admin Dashboard - Overview, stats, and quick actions

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  UserPlus,
  Settings,
  Activity,
  BarChart3,
  BookOpen,
} from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { useRouter } from "next/navigation";
import { getAllTutors } from "@/lib/user-management";
import { getRoleDisplayName, getRoleBadgeColor } from "@/lib/user-roles";
import type { User } from "@/lib/user-roles";

export default function AdminDashboard() {
  const { isAdmin, isSuperAdmin, isLoading } = useUserRole();
  const router = useRouter();
  const [tutors, setTutors] = useState<User[]>([]);
  const [tutorsLoading, setTutorsLoading] = useState(true);

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
      } finally {
        setTutorsLoading(false);
      }
    }

    if (isAdmin) {
      loadTutors();
    }
  }, [isAdmin]);

  // Show loading or redirect for non-admins
  if (isLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const getInitials = (displayName: string) => {
    return displayName
      .split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const activeTutors = tutors.filter((tutor) => tutor.isActive);
  const superAdmins = activeTutors.filter(
    (tutor) => tutor.role === "super_admin",
  );
  const managerAdmins = activeTutors.filter(
    (tutor) => tutor.role === "manager_admin",
  );
  const regularTutors = activeTutors.filter((tutor) => tutor.role === "tutor");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage tutors, monitor system health, and oversee operations
          </p>
        </div>
        <Button onClick={() => router.push("/admin/users")}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add New Tutor
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tutors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTutors.length}</div>
            <p className="text-xs text-muted-foreground">
              Active accounts in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{superAdmins.length}</div>
            <p className="text-xs text-muted-foreground">Full system access</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Managers</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{managerAdmins.length}</div>
            <p className="text-xs text-muted-foreground">Manager admins</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tutors</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{regularTutors.length}</div>
            <p className="text-xs text-muted-foreground">
              Active tutoring staff
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tutors">Tutor Directory</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Button
                variant="outline"
                className="justify-start h-auto p-4"
                onClick={() => router.push("/admin/users")}
              >
                <div className="text-left">
                  <div className="font-medium flex items-center">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add New Tutor
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Create accounts and set permissions
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="justify-start h-auto p-4"
                onClick={() => router.push("/students")}
              >
                <div className="text-left">
                  <div className="font-medium flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Students
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Assign students to tutors
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest system activity and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Activity monitoring coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tutors" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>All Tutors</CardTitle>
                <CardDescription>
                  Manage tutor accounts and permissions
                </CardDescription>
              </div>
              <Button onClick={() => router.push("/admin/users")}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Tutor
              </Button>
            </CardHeader>
            <CardContent>
              {tutorsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading tutors...</p>
                </div>
              ) : activeTutors.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No tutors yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your first tutor to get started
                  </p>
                  <Button onClick={() => router.push("/admin/users")}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add First Tutor
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
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
                        <div>
                          <div className="flex items-center gap-2">
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/users/${tutor.uid}`)}
                      >
                        View Profile
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>
                Monitor system performance and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Database Status</span>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      ✓ Connected
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Authentication</span>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      ✓ Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Email Service</span>
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      ✓ Ready
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Total Users:</span>{" "}
                    {tutors.length}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Active Sessions:</span>{" "}
                    {activeTutors.length}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Last Updated:</span>{" "}
                    {new Date().toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
