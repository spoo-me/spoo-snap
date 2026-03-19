import { useMutation } from "@tanstack/react-query";
import { shortenUrl } from "@/api/shorten";
import type { CreateUrlRequest, UrlResponse } from "@/api/types";

export function useShortenMutation() {
  return useMutation<UrlResponse, Error, CreateUrlRequest>({
    mutationFn: shortenUrl,
  });
}
