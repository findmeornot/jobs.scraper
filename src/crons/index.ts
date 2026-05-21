import initContentCron from "./instagram-content.cron";
import initProfileCron from "./instagram-profile.cron";
import { logger } from "@/utils/logger";

export function initCrons(): void {
  initContentCron();
  initProfileCron();
  logger.info("All crons initialized.");
}
