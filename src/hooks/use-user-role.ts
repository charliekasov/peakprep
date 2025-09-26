// Enhanced user role hook that extends the existing auth system
"use client";

import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { useAuth } from "@/hooks/use-auth";
import { getUserById, isUserInSystem } from "@/lib/user-management";
import {
  User,
  UserRole,
  UserPermissions,
  getUserPermissions,
} from "@/lib/user-roles";

interface UserRoleContextProps {
  // Firebase Auth user (existing)
  firebaseUser: import("firebase/auth").User | null;

  // Custom user profile with role info
  user: User | null;
  userRole: UserRole | null;
  permissions: UserPermissions | null;

  // Loading states
  authLoading: boolean; // Firebase Auth loading
  profileLoading: boolean; // User profile loading
  isLoading: boolean; // Combined loading state

  // Error states
  profileError: string | null;

  // Utility functions
  hasPermission: (permission: keyof UserPermissions) => boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;

  // Profile refresh function
  refreshProfile: () => Promise<void>;
}

const UserRoleContext = createContext<UserRoleContextProps | undefined>(
  undefined,
);

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const { user: firebaseUser, loading: authLoading } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Load user profile when Firebase auth user changes
  useEffect(() => {
    async function loadUserProfile() {
      if (!firebaseUser) {
        setUser(null);
        setProfileError(null);
        return;
      }

      setProfileLoading(true);
      setProfileError(null);

      try {
        // Check if user exists in our system
        const userExists = await isUserInSystem(firebaseUser.uid);

        if (!userExists) {
          setProfileError(
            "User profile not found. Please contact an administrator.",
          );
          setUser(null);
          return;
        }

        // Load full user profile
        const userProfile = await getUserById(firebaseUser.uid);

        if (!userProfile) {
          setProfileError("Unable to load user profile.");
          setUser(null);
          return;
        }

        if (!userProfile.isActive) {
          setProfileError(
            "This account has been deactivated. Please contact an administrator.",
          );
          setUser(null);
          return;
        }

        setUser(userProfile);
      } catch (error) {
        console.error("Error loading user profile:", error);
        setProfileError("Failed to load user profile. Please try refreshing.");
        setUser(null);
      } finally {
        setProfileLoading(false);
      }
    }

    loadUserProfile();
  }, [firebaseUser]);

  // Manual refresh function
  const refreshProfile = async () => {
    if (firebaseUser) {
      setProfileLoading(true);
      try {
        const userProfile = await getUserById(firebaseUser.uid);
        setUser(userProfile);
        setProfileError(null);
      } catch (error) {
        console.error("Error refreshing profile:", error);
        setProfileError("Failed to refresh profile.");
      } finally {
        setProfileLoading(false);
      }
    }
  };

  // Derived values
  const userRole = user?.role || null;
  const permissions = userRole ? getUserPermissions(userRole) : null;
  const isLoading = authLoading || profileLoading;
  const isAdmin = userRole
    ? userRole === "super_admin" || userRole === "manager_admin"
    : false;
  const isSuperAdmin = userRole === "super_admin";

  // Permission checker function
  const hasPermission = (permission: keyof UserPermissions): boolean => {
    return permissions ? permissions[permission] : false;
  };

  const value: UserRoleContextProps = {
    firebaseUser,
    user,
    userRole,
    permissions,
    authLoading,
    profileLoading,
    isLoading,
    profileError,
    hasPermission,
    isAdmin,
    isSuperAdmin,
    refreshProfile,
  };

  return React.createElement(UserRoleContext.Provider, { value }, children);
}

// Hook to use the user role context
export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (context === undefined) {
    throw new Error("useUserRole must be used within a UserRoleProvider");
  }
  return context;
}

// Convenience hooks for specific checks
export function usePermission(permission: keyof UserPermissions): boolean {
  const { hasPermission } = useUserRole();
  return hasPermission(permission);
}

export function useIsAdmin(): boolean {
  const { isAdmin } = useUserRole();
  return isAdmin;
}

export function useIsSuperAdmin(): boolean {
  const { isSuperAdmin } = useUserRole();
  return isSuperAdmin;
}

// Hook for components that need both Firebase user and profile
export function useFullUser() {
  const { firebaseUser, user, isLoading, profileError } = useUserRole();
  return {
    firebaseUser,
    user,
    isLoading,
    profileError,
    isAuthenticated: !!firebaseUser,
    hasProfile: !!user,
  };
}

// Type guard for checking if user has complete profile
export function userHasProfile(
  firebaseUser: import("firebase/auth").User | null,
  user: User | null,
): user is User {
  return !!firebaseUser && !!user && user.isActive;
}
