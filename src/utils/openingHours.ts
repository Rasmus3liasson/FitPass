import { Club } from "@/src/types";
import { toZonedTime } from "date-fns-tz";

export function getSwedishNow(): Date {
  const now = new Date();
  return toZonedTime(now, "Europe/Stockholm");
}

export function isClubOpenNow(club: Club): boolean {
  return isOpenNow(club.open_hours);
}

export function isOpenNow(open_hours: Record<string, string> | undefined): boolean {
  if (!open_hours) return false;
  const now = getSwedishNow();
  const day = now.toLocaleString("en-US", { weekday: "long", timeZone: "Europe/Stockholm" }).toLowerCase();
  const hours = open_hours[day];
  if (!hours) return false;
  const [open, close] = hours.split("-");
  if (!open || !close) return false;
  const [openHour, openMinute] = open.split(":").map(Number);
  const [closeHour, closeMinute] = close.split(":").map(Number);
  const [year, month, date] = [now.getFullYear(), now.getMonth(), now.getDate()];
  const openTime = new Date(year, month, date, openHour, openMinute);
  const closeTime = new Date(year, month, date, closeHour, closeMinute);
  return now >= openTime && now <= closeTime;
}

export default isClubOpenNow; 