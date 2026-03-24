import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

interface AuthPayload {
  email: string;
  password: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const authQuery = useQuery<{ user: AuthUser | null } | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (response.status === 401) {
        return { user: null };
      }

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (payload: AuthPayload) => {
      const response = await apiRequest("POST", "/api/auth/register", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (payload: AuthPayload) => {
      const response = await apiRequest("POST", "/api/auth/login", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  return {
    user: authQuery.data?.user ?? null,
    isLoading: authQuery.isLoading,
    register: registerMutation,
    login: loginMutation,
    logout: logoutMutation,
  };
}
