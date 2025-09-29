// User role types and permission management
export type UserRole = "super_admin" | "manager_admin" | "tutor";

export interface User {
  uid: string; // Firebase Auth UID
  email: string;
  displayName: string;
  role: UserRole;
  sendingEmail?: string;
  createdBy: string; // Admin who created this account
  createdDate: Date;
  isActive: boolean;

  // Enhanced Profile Fields
  location?: string; // "New York, NY" or "Remote"
  phone?: string; // Contact number
  subjects?: string[]; // ["SAT Math", "ACT English", "SSAT Verbal"]
  bio?: string; // Professional background/expertise
  availability?: string; // "Weekends and evenings"
  experience?: string; // Years of experience or background
  education?: string; // Relevant education/certifications

  // Admin-Only Fields
  adminNotes?: string; // Internal notes (only admins can edit)
  startDate?: Date; // When they joined
  hourlyRate?: string; // Billing rate

  // Profile Metadata
  profileLastUpdated?: Date; // Track when profile was modified
  profileUpdatedBy?: string; // Who made the last update
}

export interface UserPermissions {
  // Student Management
  canViewAllStudents: boolean;
  canCreateStudents: boolean;
  canArchiveStudents: boolean;
  canAssignStudentsToTutors: boolean;

  // User Management
  canCreateTutors: boolean;
  canArchiveTutors: boolean;
  canViewTutorActivity: boolean;

  // Assignment Management
  canCreateAssignments: boolean;
  canViewAssignmentLogs: boolean;

  // System Features
  canImpersonate: boolean;
  canAccessAdminPanel: boolean;

  // Email & Communication
  canSendEmails: boolean;
}

// Role definitions with their permissions
const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  super_admin: {
    // Full system access
    canViewAllStudents: true,
    canCreateStudents: true,
    canArchiveStudents: true,
    canAssignStudentsToTutors: true,
    canCreateTutors: true,
    canArchiveTutors: true,
    canViewTutorActivity: true,
    canCreateAssignments: true,
    canViewAssignmentLogs: true,
    canImpersonate: true,
    canAccessAdminPanel: true,
    canSendEmails: true,
  },
  manager_admin: {
    // Read-only oversight + own tutoring
    canViewAllStudents: true,
    canCreateStudents: true, // Can add students
    canArchiveStudents: false, // Cannot archive
    canAssignStudentsToTutors: true,
    canCreateTutors: false, // Cannot manage tutors
    canArchiveTutors: false,
    canViewTutorActivity: true, // Can monitor
    canCreateAssignments: true, // Can add assignments
    canViewAssignmentLogs: true,
    canImpersonate: false, // No impersonation
    canAccessAdminPanel: true, // Limited admin access
    canSendEmails: true,
  },
  tutor: {
    // Own students only
    canViewAllStudents: false, // Only assigned students
    canCreateStudents: true, // Can add own students
    canArchiveStudents: false, // Cannot archive
    canAssignStudentsToTutors: false,
    canCreateTutors: false,
    canArchiveTutors: false,
    canViewTutorActivity: false,
    canCreateAssignments: true, // Can add to shared library
    canViewAssignmentLogs: false,
    canImpersonate: false,
    canAccessAdminPanel: false,
    canSendEmails: true,
  },
};

// Permission checking functions
export function getUserPermissions(role: UserRole): UserPermissions {
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(
  userRole: UserRole,
  permission: keyof UserPermissions,
): boolean {
  return ROLE_PERMISSIONS[userRole][permission];
}

// Specific permission checkers for common use cases
export function canUserAccessAdmin(role: UserRole): boolean {
  return hasPermission(role, "canAccessAdminPanel");
}

export function canUserManageStudents(role: UserRole): boolean {
  return hasPermission(role, "canAssignStudentsToTutors");
}

export function canUserImpersonate(role: UserRole): boolean {
  return hasPermission(role, "canImpersonate");
}

export function canUserViewAllStudents(role: UserRole): boolean {
  return hasPermission(role, "canViewAllStudents");
}

export function isAdmin(role: UserRole): boolean {
  return role === "super_admin" || role === "manager_admin";
}

export function isSuperAdmin(role: UserRole): boolean {
  return role === "super_admin";
}

// Role display helpers
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    super_admin: "Super Administrator",
    manager_admin: "Manager",
    tutor: "Tutor",
  };
  return roleNames[role];
}

export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    super_admin: "bg-red-100 text-red-800",
    manager_admin: "bg-blue-100 text-blue-800",
    tutor: "bg-green-100 text-green-800",
  };
  return colors[role];
}

// Default role for new tutors
export const DEFAULT_TUTOR_ROLE: UserRole = "tutor";

// Validation helpers
export function isValidRole(role: string): role is UserRole {
  return ["super_admin", "manager_admin", "tutor"].includes(role);
}

export function validateUserRole(role: unknown): UserRole {
  if (typeof role !== "string" || !isValidRole(role)) {
    throw new Error(`Invalid user role: ${role}`);
  }
  return role;
}
