import { getAuthToken, clearAuthToken } from "@/services/auth.service";
import { getAllAccounts } from "@/services/instagram-account.service";

interface SyncPayload {
  username: string;
  followers: number;
  following: number;
  is_external: boolean;
}

export async function syncInstagramAccounts(): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  try {
    const accounts = await getAllAccounts();

    if (!accounts.length) {
      return { success: true, message: "No accounts to sync" };
    }

    const payload: SyncPayload[] = accounts.map((a) => ({
      username: a.username,
      followers: a.followers ?? 0,
      following: a.following ?? 0,
      is_external: a.is_external,
    }));

    const token = await getAuthToken();
    const baseUrl = process.env.AUTH_BASE_URL ?? "";

    const response = await fetch(`${baseUrl}/api/v1/service/instagram`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 401) clearAuthToken();
      throw new Error(`Sync API error: ${response.status}`);
    }

    return {
      success: true,
      message: `Synced ${payload.length} accounts`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Sync failed:", message);
    return { success: false, message: "Sync failed", error: message };
  }
}
