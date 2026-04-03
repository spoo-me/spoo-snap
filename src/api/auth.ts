import { request } from "@/api/client";
import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
  MessageResponse,
  RegisterRequest,
  RegisterResponse,
  RequestPasswordResetRequest,
  ResetPasswordRequest,
  SendVerificationResponse,
  SetPasswordRequest,
  VerifyEmailRequest,
  VerifyEmailResponse,
} from "@/api/types";
import { AUTH_ENDPOINTS } from "@/lib/constants";
import { accessTokenStorage, refreshTokenStorage } from "@/lib/storage";
import {
  loginResponseSchema,
  meResponseSchema,
  messageResponseSchema,
  refreshResponseSchema,
  registerResponseSchema,
  sendVerificationResponseSchema,
  verifyEmailResponseSchema,
} from "@/schemas/api";

export function login(data: LoginRequest): Promise<LoginResponse> {
  return request(
    AUTH_ENDPOINTS.login,
    { method: "POST", body: data, noAuth: true },
    loginResponseSchema,
  );
}

export function register(data: RegisterRequest): Promise<RegisterResponse> {
  return request(
    AUTH_ENDPOINTS.register,
    { method: "POST", body: data, noAuth: true },
    registerResponseSchema,
  );
}

export function logout(): Promise<MessageResponse> {
  return request(AUTH_ENDPOINTS.logout, { method: "POST" }, messageResponseSchema);
}

export function getMe(): Promise<MeResponse> {
  return request(AUTH_ENDPOINTS.me, {}, meResponseSchema);
}

export function setPassword(data: SetPasswordRequest): Promise<MessageResponse> {
  return request(AUTH_ENDPOINTS.setPassword, { method: "POST", body: data }, messageResponseSchema);
}

export function sendVerification(): Promise<SendVerificationResponse> {
  return request(
    AUTH_ENDPOINTS.sendVerification,
    { method: "POST" },
    sendVerificationResponseSchema,
  );
}

export function verifyEmail(data: VerifyEmailRequest): Promise<VerifyEmailResponse> {
  return request(
    AUTH_ENDPOINTS.verifyEmail,
    { method: "POST", body: data },
    verifyEmailResponseSchema,
  );
}

export function requestPasswordReset(data: RequestPasswordResetRequest): Promise<MessageResponse> {
  return request(
    AUTH_ENDPOINTS.requestPasswordReset,
    { method: "POST", body: data, noAuth: true },
    messageResponseSchema,
  );
}

export function resetPassword(data: ResetPasswordRequest): Promise<MessageResponse> {
  return request(
    AUTH_ENDPOINTS.resetPassword,
    { method: "POST", body: data, noAuth: true },
    messageResponseSchema,
  );
}

/**
 * Refresh the access token using a persisted refresh token.
 * Uses raw fetch (not the API client) because the access token
 * doesn't exist yet during restoration.
 *
 * Returns true if the token was refreshed, false otherwise.
 */
export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = await refreshTokenStorage.getValue();
  if (!refreshToken) return false;

  try {
    const res = await fetch(AUTH_ENDPOINTS.refresh, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
      },
    });

    if (res.ok) {
      const data = refreshResponseSchema.parse(await res.json());
      await accessTokenStorage.setValue(data.access_token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
