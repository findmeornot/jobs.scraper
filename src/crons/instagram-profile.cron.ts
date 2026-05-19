import cron from "node-cron";
import { getAllAccounts, saveOrUpdateAccount } from "@/services/instagram-account.service";
import { syncInstagramAccounts } from "@/services/sync.service";
import { scrapeProfile } from "@/scraper/index";
import { fetchUserInfo } from "@/scraper/fetch";
import { instagramConfig } from "@/config/instagram";
import { now } from "@/utils/date";

const BATCH_SIZE = 30;
const BATCH_DELAY_MS = 30_000;

async function processUsernames(usernames: string[]): Promise<void> {
  for (const username of usernames) {
    try {
      const profile = await scrapeProfile(username);

      if (instagramConfig.sessionId && profile.id) {
        try {
          const info = await fetchUserInfo(profile.id, instagramConfig.sessionId);
          await saveOrUpdateAccount({
            instagram_id: profile.id,
            username,
            followers: info.follower_count,
            following: info.following_count,
          });
          continue;
        } catch {
          // fall through to basic save
        }
      }

      await saveOrUpdateAccount({
        instagram_id: profile.id,
        username,
        followers: 0,
        following: 0,
      });
    } catch (err) {
      console.error(`Error processing @${username}:`, err);
    }
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function updateInstagramProfiles(): Promise<void> {
  try {
    console.log("Starting Instagram profile update...");
    const accounts = await getAllAccounts(false);

    if (!accounts.length) {
      console.log("No accounts to update");
      return;
    }

    const batches = chunk(accounts.map((a) => a.username), BATCH_SIZE);
    console.log(`Processing ${accounts.length} accounts in ${batches.length} batches...`);

    for (let i = 0; i < batches.length; i++) {
      await processUsernames(batches[i]!);
      if (i < batches.length - 1) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
      }
    }

    console.log("Profile update complete. Syncing accounts...");
    const syncResult = await syncInstagramAccounts();
    console.log(`Sync result: ${syncResult.message}`);
  } catch (err) {
    console.error("Profile cron error:", err);
  }
}

export default function initProfileCron(): void {
  cron.schedule("0 0 * * *", async () => {
    console.log(`[${now().format("YYYY-MM-DD HH:mm:ss")}] Starting profile cron...`);
    await updateInstagramProfiles();
  });
  console.log("Profile cron registered: daily at 00:00");
}
