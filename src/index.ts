import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { db } from "@/db/index";
import { startServer } from "@/server";
import { initCrons } from "@/crons/index";
import { markStuckSessionsFailed } from "@/repositories/scrape-log.repo";
import { logger } from "@/utils/logger";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Jakarta");
process.env.TZ = "Asia/Jakarta";

async function bootstrap(): Promise<void> {
  if (!process.env.PASSWORD) {
    logger.error("PASSWORD env variable is not set — refusing to start");
    process.exit(1);
  }

  try {
    await db`SELECT 1`;
    logger.info("Database connected");

    const stuck = await markStuckSessionsFailed();
    if (stuck > 0) logger.warn({ stuck }, `Marked ${stuck} stuck session(s) as failed`);

    startServer();
    initCrons();

    logger.info(
      { timezone: process.env.TZ, now: dayjs().format("YYYY-MM-DD HH:mm:ss Z") },
      "Bootstrap complete",
    );
  } catch (error) {
    logger.error({ error }, "Bootstrap failed");
    process.exit(1);
  }
}

bootstrap();
