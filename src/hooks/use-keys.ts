import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createApiKey, deleteApiKey, listApiKeys } from "@/api/keys";
import type { CreateApiKeyRequest } from "@/api/types";

const KEYS_KEY = ["api-keys"] as const;

export function useApiKeys() {
  return useQuery({
    queryKey: KEYS_KEY,
    queryFn: listApiKeys,
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateApiKeyRequest) => createApiKey(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS_KEY });
    },
  });
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ keyId, revoke }: { keyId: string; revoke?: boolean }) =>
      deleteApiKey(keyId, revoke),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS_KEY });
    },
  });
}
