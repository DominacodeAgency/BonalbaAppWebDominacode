// src/services/authService.ts
/**
 * authService.ts
 * Encapsula las llamadas al backend relacionadas con autenticación
 * (por ejemplo login), usando el cliente API centralizado.
 */

import { apiFetch } from "@/lib/api";
import { saveToken } from "@/lib/auth";

export type LoginResponse = {
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
    area: string | null;
    name: string | null;
  };
  accessToken: string;
};

export async function login(username: string, password: string) {
  const data = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  // Guardamos token para futuras llamadas
  saveToken(data.accessToken);

  return data;
}
