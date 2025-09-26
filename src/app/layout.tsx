"use client";

import { usePathname } from "next/navigation";
import "./globals.css";
import { cn } from "@/lib/utils";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { UserNav } from "@/components/user-nav";
import { Nav } from "@/components/nav";
import { Logo } from "@/components/logo";
import { Toaster } from "@/components/ui/toaster";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { UserRoleProvider } from "@/hooks/use-user-role";

function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const isLoginPage = pathname === "/login";

  const LayoutSkeleton = () => (
    <div className="flex min-h-screen">
      <div className="hidden md:flex flex-col w-64 border-r p-2 gap-2 bg-card">
        <div className="p-2 flex items-center gap-2">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex flex-col gap-1 p-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="mt-auto p-2">
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="flex-1 p-8">
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  );

  const AppContent = () => (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <Nav />
        </SidebarContent>
        <SidebarFooter>
          <UserNav />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 md:hidden">
          <SidebarTrigger />
          <div className="ml-auto">
            <UserNav />
          </div>
        </header>
        <div className="container mx-auto px-4 md:px-6 lg:px-8"></div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );

  const renderContent = () => {
    if (loading) {
      return <LayoutSkeleton />;
    }
    if (isLoginPage) {
      return children;
    }
    if (user) {
      return <AppContent />;
    }
    // If not loading, not on login page, and no user, we show the skeleton while redirecting.
    return <LayoutSkeleton />;
  };

  return <>{renderContent()}</>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Peak Prep</title>
        <meta
          name="description"
          content="Streamlined student and assignment management."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Code+Pro&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn("font-body antialiased")}>
        <AuthProvider>
          <UserRoleProvider>
            <AppLayout>{children}</AppLayout>
          </UserRoleProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
