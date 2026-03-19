import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as authApi from "@/api/auth";
import type { LoginRequest, RegisterRequest } from "@/api/types";
import { useAuthStore } from "@/stores/auth";

export function useLogin() {
  const { setJwtAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      // The refresh token comes via cookie from the server.
      // We store the access token and user profile.
      await setJwtAuth(data.access_token, "", data.user);
      queryClient.invalidateQueries();
    },
  });
}

export function useRegister() {
  const { setJwtAuth } = useAuthStore();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: async (data) => {
      await setJwtAuth(data.access_token, "", data.user);
    },
  });
}

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: async () => {
      await clearAuth();
      queryClient.clear();
    },
  });
}

export function useMe(enabled = true) {
  const { mode } = useAuthStore();

  return useQuery({
    queryKey: ["me"],
    queryFn: authApi.getMe,
    enabled: enabled && mode !== "anonymous",
  });
}

export function useLoginForm() {
  const login = useLogin();

  const submit = (data: LoginRequest) => {
    login.mutate(data);
  };

  return { submit, ...login };
}

export function useRegisterForm() {
  const register = useRegister();

  const submit = (data: RegisterRequest) => {
    register.mutate(data);
  };

  return { submit, ...register };
}
