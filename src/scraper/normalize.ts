import type { RawShot, Shot } from "../types";

function parseCount(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number.parseInt(String(value).replace(/[^\d]/g, ""), 10);
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
  const id = parseCount(rawShot.id) || parseIdFromUrl(rawShot.url);
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
