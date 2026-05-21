import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { LoginFormData } from "@/schemas/auth.schema";

async function fetchAuthMe(): Promise<{ authenticated: boolean }> {
  const res = await fetch("/api/auth/me", { credentials: "same-origin" });
  if (res.status === 401) return { authenticated: false };
  if (!res.ok) throw new Error(`Unexpected status: ${res.status}`);
  return res.json() as Promise<{ authenticated: boolean }>;
}

export function useAuthCheck() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchAuthMe,
    retry: false,
    staleTime: Infinity,
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginFormData) =>
      apiFetch<{ success: boolean }>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(data),
      }),
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: () =>
      apiFetch<{ success: boolean }>("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      }),
  });
}
