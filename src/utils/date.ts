import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export const TZ = "Asia/Jakarta";

export function now(): dayjs.Dayjs {
  return dayjs().tz(TZ);
}

export function fromUnix(timestamp: number): dayjs.Dayjs {
  return dayjs.unix(timestamp).tz(TZ);
}

export function subtractDays(days: number): Date {
  return dayjs().tz(TZ).subtract(days, "day").toDate();
}

export function formatDisplay(date: string | Date): string {
  return dayjs(date).tz(TZ).format("DD-MMM-YYYY");
}

export function formatFull(date?: string | Date): string {
  return dayjs(date).tz(TZ).format("YYYY-MM-DD HH:mm:ss");
}
