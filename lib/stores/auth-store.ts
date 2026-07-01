import { create } from "zustand";
import type { AuthUser } from "@/types/auth";
import { permissionEngine } from "@/lib/rbac/engine";
import type { Permission } from "@/lib/rbac/permissions";

interface AuthStore {
  user: AuthUser | null;
  isLoading: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user, isLoading: false }),

  setLoading: (isLoading) => set({ isLoading }),

  clear: () => set({ user: null, isLoading: false }),

  hasPermission: (permission) => {
    const { user } = get();
    if (!user) return false;
    return permissionEngine.can(user.permissions, permission);
  },

  hasAnyPermission: (permissions) => {
    const { user } = get();
    if (!user) return false;
    return permissionEngine.canAny(user.permissions, permissions);
  },

  hasAllPermissions: (permissions) => {
    const { user } = get();
    if (!user) return false;
    return permissionEngine.canAll(user.permissions, permissions);
  },
}));
