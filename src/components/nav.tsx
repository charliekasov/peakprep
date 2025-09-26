"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  FileText,
  Mail,
  CheckSquare,
  BarChart,
  Settings,
  UserCog,
} from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";

const navItems = [
  {
    href: "/",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    href: "/students",
    icon: Users,
    label: "Students",
  },
  {
    href: "/assignments",
    icon: FileText,
    label: "Assignments",
  },
  {
    href: "/assign-homework",
    icon: Mail,
    label: "Assign Homework",
  },
  {
    href: "/needs-review",
    icon: CheckSquare,
    label: "Needs Review",
  },
  {
    href: "/test-scores",
    icon: BarChart,
    label: "Test Scores",
  },
];

const adminNavItems = [
  {
    href: "/admin",
    icon: Settings,
    label: "Admin Dashboard",
  },
  {
    href: "/admin/users",
    icon: UserCog,
    label: "Manage Tutors",
  },
];

export function Nav() {
  const pathname = usePathname();
  const { isAdmin, isLoading } = useUserRole();

  return (
    <>
      {/* Main Navigation */}
      <SidebarGroup>
        <SidebarGroupLabel>Tutoring</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={
                      pathname.startsWith(item.href) &&
                      (item.href !== "/" || pathname === "/")
                    }
                    tooltip={{ children: item.label }}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Admin Navigation - Only show for admin users */}
      {!isLoading && isAdmin && (
        <>
          <SidebarSeparator />
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href}>
                      <SidebarMenuButton
                        isActive={pathname.startsWith(item.href)}
                        tooltip={{ children: item.label }}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </>
      )}
    </>
  );
}
