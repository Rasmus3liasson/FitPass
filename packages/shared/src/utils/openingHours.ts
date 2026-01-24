import { Club } from '../types';
import { toZonedTime } from 'date-fns-tz';

export function getSwedishNow(): Date {
  const now = new Date();
  return toZonedTime(now, 'Europe/Stockholm');
}

// Returns: "open", "closing_soon", or "closed"
export function isClubOpenNow(club: Club): 'open' | 'closing_soon' | 'closed' {
  return getOpenState(club.open_hours);
}

export function getOpenState(
  open_hours: Record<string, string> | undefined
): 'open' | 'closing_soon' | 'closed' {
  if (!open_hours) return 'closed';
  const now = getSwedishNow();
  const day = now
    .toLocaleString('en-US', { weekday: 'long', timeZone: 'Europe/Stockholm' })
    .toLowerCase();
  const hours = open_hours[day];
  if (!hours) return 'closed';
  const [open, close] = hours.split('-');
  if (!open || !close) return 'closed';
  const [openHour, openMinute] = open.split(':').map(Number);
  const [closeHour, closeMinute] = close.split(':').map(Number);
  const [year, month, date] = [now.getFullYear(), now.getMonth(), now.getDate()];
  const openTime = new Date(year, month, date, openHour, openMinute);
  const closeTime = new Date(year, month, date, closeHour, closeMinute);

  if (now < openTime || now > closeTime) return 'closed';
  // Check if within 1 hour of closing
  const oneHourBeforeClose = new Date(closeTime.getTime() - 60 * 60 * 1000);
  if (now >= oneHourBeforeClose && now < closeTime) return 'closing_soon';
  return 'open';
}
