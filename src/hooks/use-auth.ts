import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as authApi from "@/api/auth";
import { useAuthStore } from "@/stores/auth";

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => clearAuth(),
    onSettled: () => queryClient.clear(),
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
