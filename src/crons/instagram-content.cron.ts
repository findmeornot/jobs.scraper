import { scrapePosts } from "@/scraper/index";
import { InstagramNotFoundError } from "@/scraper/fetch";
import { getAllAccounts, removeAccount } from "@/services/instagram-account.service";
import { saveInstagramContent } from "@/services/instagram-content.service";
import { scrapeLogService } from "@/services/scrape-log.service";
import { subtractDays, now } from "@/utils/date";
import { logger } from "@/utils/logger";

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
  if (scrapeLogService.isScraping) {
    logger.info("Scrape already in progress, skipping.");
    return;
  }

  const sessionId = await scrapeLogService.startSession();

  try {
    const externalAccounts = await getAllAccounts(true);
    const state = await loadState(externalAccounts.map((a) => a.username));

    const allDone = Object.values(state.accounts).every((a) => a.status === 1);
    if (allDone) {
      await scrapeLogService.log(
        sessionId,
        "info",
        "All accounts already processed today, skipping.",
      );
      await scrapeLogService.endSession(
        sessionId,
        { totalAccounts: externalAccounts.length, successCount: 0, errorCount: 0, deletedCount: 0 },
        "completed",
      );
      return;
    }

    await scrapeLogService.log(
      sessionId,
      "info",
      `Starting scrape of ${externalAccounts.length} external accounts`,
    );
    state.scrape_status = { last_run: now().toISOString(), is_completed: false };
    await saveState(state);

    const afterDate = subtractDays(1);
    let totalContent = 0;
    let successCount = 0;
    let errorCount = 0;
    let deletedCount = 0;

    for (const account of externalAccounts) {
      // Wait while paused (blocks here until resumed or stopped)
      await scrapeLogService.waitIfPaused();

      // Exit if stop was requested
      if (scrapeLogService.stopRequested) {
        await scrapeLogService.log(sessionId, "warn", "Scrape stopped by user");
        break;
      }

      if (state.accounts[account.username]?.status === 1) {
        continue;
      }

      if (!account.instagram_id) {
        await scrapeLogService.log(sessionId, "warn", `Skipped — no Instagram ID`, {
          username: account.username,
        });
        continue;
      }

      try {
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
            logger.error({ shortcode: post.shortcode, error: err }, "Error saving post");
          }
        }

        successCount++;
        await scrapeLogService.log(sessionId, "success", `${posts.first} posts scraped`, {
          username: account.username,
          postsCount: posts.first,
        });

        state.accounts[account.username] = { status: 1, lastScrapedDate: now().toISOString() };
        state.scrape_status.last_run = now().toISOString();
        await saveState(state);
      } catch (err) {
        if (err instanceof InstagramNotFoundError) {
          await scrapeLogService.log(sessionId, "warn", `Account not found — deleted`, {
            username: account.username,
          });
          deletedCount++;
          await removeAccount(account.id).catch((e) =>
            logger.error({ username: account.username, error: e }, "Failed to delete account"),
          );
        } else {
          errorCount++;
          const msg = err instanceof Error ? err.message : String(err);
          await scrapeLogService.log(sessionId, "error", msg, { username: account.username });
        }
      }
    }

    state.lastRunDate = now().toISOString();
    state.scrape_status = { last_run: state.lastRunDate, is_completed: true };
    await saveState(state);

    await scrapeLogService.log(
      sessionId,
      "info",
      `Scrape complete — ${successCount} success, ${errorCount} errors, ${deletedCount} deleted, ${totalContent} new posts`,
    );
    const endStatus = scrapeLogService.stopRequested ? "failed" : "completed";
    await scrapeLogService.endSession(
      sessionId,
      { totalAccounts: externalAccounts.length, successCount, errorCount, deletedCount },
      endStatus,
    );
  } catch (err) {
    logger.error({ error: err }, "Content cron error");
    await scrapeLogService.log(
      sessionId,
      "error",
      `Scrape failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    await scrapeLogService.endSession(
      sessionId,
      { totalAccounts: 0, successCount: 0, errorCount: 1, deletedCount: 0 },
      "failed",
    );
  }
}

export default function initContentCron(): void {
  Bun.cron("0 13 * * *", async () => {
    logger.info("Starting content cron");
    await scrapeAllExternalAccounts();
  });
  logger.info("Content cron registered: daily at 20:00 WIB (13:00 UTC)");
}
