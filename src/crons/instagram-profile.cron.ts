import { getAllAccounts, saveOrUpdateAccount } from "@/services/instagram-account.service";
import { scrapeProfile } from "@/scraper/index";
import { fetchUserInfo } from "@/scraper/fetch";
import { instagramConfig } from "@/config/instagram";
import { logger } from "@/utils/logger";

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
      logger.error({ username, error: err }, "Error processing account");
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
    logger.info("Starting Instagram profile update");
    const accounts = await getAllAccounts(false);

    if (!accounts.length) {
      logger.info("No accounts to update");
      return;
    }

    const batches = chunk(
      accounts.map((a) => a.username),
      BATCH_SIZE,
    );
    logger.info({ accounts: accounts.length, batches: batches.length }, "Processing accounts");

    for (let i = 0; i < batches.length; i++) {
      await processUsernames(batches[i]!);
      if (i < batches.length - 1) {
        await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
      }
    }

    logger.info("Profile update complete");
  } catch (err) {
    logger.error({ error: err }, "Profile cron error");
  }
}

export default function initProfileCron(): void {
  Bun.cron("0 0 * * *", async () => {
    logger.info("Starting profile cron");
    await updateInstagramProfiles();
  });
  logger.info("Profile cron registered: daily at 00:00 UTC");
}
