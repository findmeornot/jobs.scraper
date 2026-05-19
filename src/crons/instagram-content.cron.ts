import cron from "node-cron";
import { scrapePosts } from "@/scraper/index";
import { getAllAccounts } from "@/services/instagram-account.service";
import { saveInstagramContent } from "@/services/instagram-content.service";
import { subtractDays, now } from "@/utils/date";

interface AccountState {
  status: 0 | 1;
  lastScrapedDate: string;
}

interface ScrapeState {
  scrape_status: { last_run: string; is_completed: boolean };
  accounts: Record<string, AccountState>;
  lastRunDate: string;
}

function stateFilePath(): string {
  const date = now().format("YYYY-MM-DD");
  return `${process.cwd()}/states/instagram-scrape-state_${date}.json`;
}

async function loadState(usernames: string[]): Promise<ScrapeState> {
  try {
    const file = Bun.file(stateFilePath());
    const state = (await file.json()) as Partial<ScrapeState>;
    const accounts: Record<string, AccountState> = state.accounts ?? {};

    for (const username of usernames) {
      if (!accounts[username]) {
        accounts[username] = {
          status: 0,
          lastScrapedDate: now().subtract(1, "day").toISOString(),
        };
      }
    }

    return {
      scrape_status: state.scrape_status ?? {
        last_run: now().subtract(1, "day").toISOString(),
        is_completed: false,
      },
      accounts,
      lastRunDate: state.lastRunDate ?? now().subtract(1, "day").toISOString(),
    };
  } catch {
    const accounts: Record<string, AccountState> = {};
    for (const username of usernames) {
      accounts[username] = {
        status: 0,
        lastScrapedDate: now().subtract(1, "day").toISOString(),
      };
    }
    return {
      scrape_status: { last_run: now().subtract(1, "day").toISOString(), is_completed: false },
      accounts,
      lastRunDate: now().subtract(1, "day").toISOString(),
    };
  }
}

async function saveState(state: ScrapeState): Promise<void> {
  const path = stateFilePath();
  await Bun.$`mkdir -p ${process.cwd()}/states`.quiet();
  await Bun.write(path, JSON.stringify(state, null, 2));
}

export async function scrapeAllExternalAccounts(): Promise<void> {
  try {
    const externalAccounts = await getAllAccounts(true);
    const state = await loadState(externalAccounts.map((a) => a.username));

    const allDone = Object.values(state.accounts).every((a) => a.status === 1);
    if (allDone) {
      console.log("All accounts already processed today, skipping.");
      return;
    }

    console.log(`Scraping ${externalAccounts.length} external accounts...`);
    state.scrape_status = { last_run: now().toISOString(), is_completed: false };
    await saveState(state);

    const afterDate = subtractDays(2);
    let totalContent = 0;

    for (const account of externalAccounts) {
      if (state.accounts[account.username]?.status === 1) {
        console.log(`Skipping ${account.username} — already done today`);
        continue;
      }

      if (!account.instagram_id) {
        console.warn(`Skipping ${account.username} — no instagram_id`);
        continue;
      }

      try {
        console.log(`Scraping @${account.username}...`);
        const posts = await scrapePosts(account.instagram_id, undefined, afterDate);

        for (const post of posts.result) {
          try {
            await saveInstagramContent({
              instagram_id: post.id,
              caption: post.caption,
              shortcode: post.shortcode,
              display_url: post.display_url,
              account_id: account.id,
              posted_at: new Date(post.created_at),
            });
            totalContent++;
          } catch (err) {
            console.error(`Error saving post ${post.shortcode}:`, err);
          }
        }

        state.accounts[account.username] = {
          status: 1,
          lastScrapedDate: now().toISOString(),
        };
        state.scrape_status.last_run = now().toISOString();
        await saveState(state);

        console.log(`@${account.username}: ${posts.first} posts scraped`);
      } catch (err) {
        console.error(`Error scraping @${account.username}:`, err);
      }
    }

    state.lastRunDate = now().toISOString();
    state.scrape_status = { last_run: state.lastRunDate, is_completed: true };
    await saveState(state);
    console.log(`Scrape complete. Total new content: ${totalContent}`);
  } catch (err) {
    console.error("Content cron error:", err);
  }
}

export default function initContentCron(): void {
  cron.schedule("0 17 * * *", async () => {
    console.log(`[${now().format("YYYY-MM-DD HH:mm:ss")}] Starting content cron...`);
    await scrapeAllExternalAccounts();
  });
  console.log("Content cron registered: daily at 17:00");
}
