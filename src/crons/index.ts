import initContentCron from "./instagram-content.cron";
import initProfileCron from "./instagram-profile.cron";

export function initCrons(): void {
  initContentCron();
  initProfileCron();
  console.log("All crons initialized.");
}
