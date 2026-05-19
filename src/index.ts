import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { db } from "@/db/index";
import { startServer } from "@/server";
import { initCrons } from "@/crons/index";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Jakarta");
process.env.TZ = "Asia/Jakarta";

async function bootstrap(): Promise<void> {
  try {
    // Verify database connectivity with a lightweight query
    await db`SELECT 1`;
    console.log("✅ Database connected");

    startServer();
    initCrons();

    console.log(`🕒 Timezone: ${process.env.TZ}`);
    console.log(`📅 ${dayjs().format("YYYY-MM-DD HH:mm:ss Z")}`);
  } catch (error) {
    console.error("Bootstrap failed:", error);
    process.exit(1);
  }
}

bootstrap();
