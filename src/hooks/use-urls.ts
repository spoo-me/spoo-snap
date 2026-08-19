import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UrlId } from "spoo.me";
import { deleteUrl, type ListUrlsParams, listUrls, updateUrlStatus } from "@/api/urls";

const URLS_KEY = ["urls"] as const;

export function useUrls(params: ListUrlsParams = {}) {
  return useQuery({
    queryKey: [...URLS_KEY, params],
    queryFn: () => listUrls(params),
  });
}

export function useUpdateUrlStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ urlId, status }: { urlId: UrlId; status: "ACTIVE" | "INACTIVE" }) =>
      updateUrlStatus(urlId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: URLS_KEY });
    },
  });
}

export function useDeleteUrl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUrl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: URLS_KEY });
    },
  });
}
