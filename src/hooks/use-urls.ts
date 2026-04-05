import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  DeleteUrlResponse,
  ListUrlsQuery,
  UpdateUrlRequest,
  UpdateUrlResponse,
  UpdateUrlStatusRequest,
} from "@/api/types";
import { deleteUrl, listUrls, updateUrl, updateUrlStatus } from "@/api/urls";

const URLS_KEY = ["urls"] as const;

export function useUrls(query: ListUrlsQuery = {}) {
  return useQuery({
    queryKey: [...URLS_KEY, query],
    queryFn: () => listUrls(query),
  });
}

export function useUpdateUrl() {
  const queryClient = useQueryClient();
  return useMutation<UpdateUrlResponse, Error, { urlId: string; data: UpdateUrlRequest }>({
    mutationFn: ({ urlId, data }) => updateUrl(urlId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: URLS_KEY });
    },
  });
}

export function useUpdateUrlStatus() {
  const queryClient = useQueryClient();
  return useMutation<UpdateUrlResponse, Error, { urlId: string; data: UpdateUrlStatusRequest }>({
    mutationFn: ({ urlId, data }) => updateUrlStatus(urlId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: URLS_KEY });
    },
  });
}

export function useDeleteUrl() {
  const queryClient = useQueryClient();
  return useMutation<DeleteUrlResponse, Error, string>({
    mutationFn: deleteUrl,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: URLS_KEY });
    },
  });
}
