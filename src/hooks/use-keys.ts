import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteApiKey, listApiKeys } from "@/api/keys";

const KEYS_KEY = ["api-keys"] as const;

export function useApiKeys() {
  return useQuery({
    queryKey: KEYS_KEY,
    queryFn: listApiKeys,
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
