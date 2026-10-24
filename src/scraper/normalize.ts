import type { RawShot, Shot } from "../types";

function parseInteger(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number.parseInt(String(value).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseCount(value: string | number | null | undefined): number {
  const match = String(value).trim().match(/^(\d+(?:\.\d+)?)([km])$/i);
  if (!match) return parseInteger(value);

  const multiplier = match[2]?.toLowerCase() === "k" ? 1_000 : 1_000_000;
  const parsed = Math.round(Number(match[1]) * multiplier);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseIdFromUrl(url: string | null | undefined): number | null {
  if (!url) return null;
  const match = String(url).match(/\/shots\/(\d+)/);
  const parsedId = match?.[1];
  return parsedId ? Number.parseInt(parsedId, 10) : null;
}

function toAbsoluteUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url, "https://dribbble.com").href;
  } catch {
    return null;
  }
}

export function normalizeShot(rawShot: RawShot): Shot | null {
  const id = parseInteger(rawShot.id) || parseIdFromUrl(rawShot.url);
  const img = rawShot.img ?? null;
  const url = toAbsoluteUrl(rawShot.url);

  if (!id || !img || !url) return null;

  return {
    id,
    img,
    video: rawShot.video ?? null,
    url,
    likes: parseCount(rawShot.likes),
    comments: parseCount(rawShot.comments),
    viewsString: rawShot.viewsString || "0",
    title: rawShot.title || "",
    author: {
      name: rawShot.author?.name || "",
      url: toAbsoluteUrl(rawShot.author?.url) || "",
    },
  };
}
