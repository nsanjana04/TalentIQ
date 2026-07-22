"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";
import { apiClient } from "@/lib/api-client";
import { authMeQueryKey } from "@/lib/auth/query-keys";
import { ROUTES } from "@/constants/routes";
import type { AuthUser, LoginCredentials } from "@/types/auth";

async function fetchCurrentUser(): Promise<AuthUser> {
  return apiClient.get<AuthUser>("/api/auth/me");
}

async function refreshSession(): Promise<AuthUser> {
  const result = await apiClient.post<{ user: AuthUser }>("/api/auth/refresh");
  return result.user;
}

export function useAuth() {
  const { user, isLoading, setUser, setLoading, clear, hasPermission } = useAuthStore();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null>(null);

  const meQueryKey = authMeQueryKey(user?.id);

  const meQuery = useQuery({
    queryKey: meQueryKey,
    queryFn: fetchCurrentUser,
    enabled: typeof window !== "undefined",
    retry: (failureCount, error) => {
      if (error && "status" in error && (error as { status: number }).status === 401) {
        return failureCount < 1;
      }
      return false;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (meQuery.data) {
      setUser(meQuery.data);
    } else if (meQuery.isError) {
      clear();
    } else if (!meQuery.isLoading && meQuery.isFetched && !meQuery.data) {
      setLoading(false);
    }
  }, [meQuery.data, meQuery.isError, meQuery.isLoading, meQuery.isFetched, setUser, setLoading, clear]);

  // Drop all cached queries when the signed-in user changes (login / user switch).
  useEffect(() => {
    const currentId = user?.id ?? meQuery.data?.id ?? null;
    if (currentId && prevUserIdRef.current && prevUserIdRef.current !== currentId) {
      queryClient.clear();
      if (user) {
        queryClient.setQueryData(authMeQueryKey(user.id), user);
      }
    }
    prevUserIdRef.current = currentId;
  }, [user, meQuery.data?.id, queryClient]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      clear();
      queryClient.clear();
      return apiClient.post<{ user: AuthUser }>("/api/auth/login", credentials);
    },
    onSuccess: async (data) => {
      let resolved: AuthUser;
      try {
        resolved = await refreshSession();
      } catch {
        const fresh = await fetchCurrentUser();
        resolved = fresh?.id ? fresh : data.user;
      }
      setUser(resolved);
      queryClient.setQueryData(authMeQueryKey(resolved.id), resolved);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiClient.post("/api/auth/logout"),
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) =>
      apiClient.post<{ message: string }>("/api/auth/forgot-password", { email }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: { email: string; token: string; password: string; confirmPassword: string }) =>
      apiClient.post<{ message: string }>("/api/auth/reset-password", data),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
      apiClient.post<{ message: string }>("/api/auth/change-password", data),
  });

  const verifyEmailMutation = useMutation({
    mutationFn: (data: { email: string; token: string }) =>
      apiClient.post<{ message: string }>("/api/auth/verify-email", data),
  });

  const resendVerificationMutation = useMutation({
    mutationFn: (email: string) =>
      apiClient.post<{ message: string }>("/api/auth/resend-verification", { email }),
  });

  const login = useCallback(
    (credentials: LoginCredentials) => loginMutation.mutateAsync(credentials),
    [loginMutation]
  );

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Still clear local state if API fails
    } finally {
      prevUserIdRef.current = null;
      clear();
      queryClient.clear();
      if (typeof window !== "undefined") {
        sessionStorage.clear();
        const theme = useThemeStore.getState().mode;
        localStorage.clear();
        useThemeStore.getState().setMode(theme);
        window.location.replace(ROUTES.LOGIN);
      }
    }
  }, [logoutMutation, clear, queryClient]);

  const currentUser = user ?? meQuery.data ?? null;

  return {
    user: currentUser,
    isAuthenticated: !!currentUser,
    isLoading: !currentUser && (isLoading || meQuery.isPending),
    login,
    logout,
    hasPermission,
    loginError: loginMutation.error,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    forgotPassword: forgotPasswordMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    changePassword: changePasswordMutation.mutateAsync,
    verifyEmail: verifyEmailMutation.mutateAsync,
    resendVerification: resendVerificationMutation.mutateAsync,
    forgotPasswordState: forgotPasswordMutation,
    resetPasswordState: resetPasswordMutation,
    changePasswordState: changePasswordMutation,
    verifyEmailState: verifyEmailMutation,
    resendVerificationState: resendVerificationMutation,
    refetchUser: async () => {
      const key = authMeQueryKey(currentUser?.id);
      await queryClient.invalidateQueries({ queryKey: key });
      return queryClient.fetchQuery({ queryKey: key, queryFn: fetchCurrentUser });
    },
    refreshPermissions: async () => {
      const fresh = await refreshSession();
      setUser(fresh);
      queryClient.setQueryData(authMeQueryKey(fresh.id), fresh);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["rbac"] });
      return fresh;
    },
  };
}
