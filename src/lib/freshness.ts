import { formatDistanceToNow, differenceInHours } from "date-fns";

export type Freshness = "fresh" | "aging" | "stale";

/** Classify how fresh a report is */
export function getFreshness(createdAt: string): Freshness {
  const hours = differenceInHours(new Date(), new Date(createdAt));
  if (hours < 24) return "fresh";
  if (hours < 48) return "aging";
  return "stale";
}

/** Human-readable time label with staleness warning */
export function getTimeLabel(createdAt: string): string {
  const base = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  const freshness = getFreshness(createdAt);
  if (freshness === "stale") return `${base} (may be outdated)`;
  return base;
}
