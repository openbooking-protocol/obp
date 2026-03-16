import { format, formatDistanceToNow, parseISO } from "date-fns";

export function formatDate(dateStr: string, pattern = "PPP"): string {
  return format(parseISO(dateStr), pattern);
}

export function formatTime(dateStr: string): string {
  return format(parseISO(dateStr), "HH:mm");
}

export function formatDateTime(dateStr: string): string {
  return format(parseISO(dateStr), "PPP 'at' HH:mm");
}

export function formatRelative(dateStr: string): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
}

export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

export function formatCountdown(expiresAt: string): string {
  const now = Date.now();
  const exp = new Date(expiresAt).getTime();
  const diffMs = exp - now;
  if (diffMs <= 0) return "00:00";
  const totalSeconds = Math.ceil(diffMs / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function dateRangeForDays(startDate: Date, days: number): { from: string; to: string } {
  const from = new Date(startDate);
  const to = new Date(startDate);
  to.setDate(to.getDate() + days - 1);
  to.setHours(23, 59, 59, 999);
  return {
    from: from.toISOString().split("T")[0]!,
    to: to.toISOString().split("T")[0]!,
  };
}
