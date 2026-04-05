import type { ClassicQrParams, GradientQrParams } from "@/api/types";
import { QR_API_V1 } from "@/lib/constants";

/**
 * Build a classic QR code URL (GET endpoint — returns image directly).
 */
export function classicQrUrl(params: ClassicQrParams): string {
  const url = new URL(`${QR_API_V1}/classic`);
  url.searchParams.set("content", params.content);
  if (params.color) url.searchParams.set("color", params.color);
  if (params.background) url.searchParams.set("background", params.background);
  if (params.size) url.searchParams.set("size", String(params.size));
  if (params.style) url.searchParams.set("style", params.style);
  if (params.output) url.searchParams.set("output", params.output);
  return url.toString();
}

/**
 * Build a gradient QR code URL (GET endpoint — returns image directly).
 */
export function gradientQrUrl(params: GradientQrParams): string {
  const url = new URL(`${QR_API_V1}/gradient`);
  url.searchParams.set("content", params.content);
  if (params.start) url.searchParams.set("start", params.start);
  if (params.end) url.searchParams.set("end", params.end);
  if (params.background) url.searchParams.set("background", params.background);
  if (params.size) url.searchParams.set("size", String(params.size));
  if (params.style) url.searchParams.set("style", params.style);
  if (params.direction) url.searchParams.set("direction", params.direction);
  if (params.output) url.searchParams.set("output", params.output);
  return url.toString();
}
