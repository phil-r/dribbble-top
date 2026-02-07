import type { Shot } from "../types";
import type { BrowserScrapeOptions } from "./browser";
import { getTopFromBrowser } from "./browser";
import { getTopFromHttpFallback } from "./fallback";

export async function getTop(options: BrowserScrapeOptions): Promise<Shot[]> {
  try {
    const browserShots = await getTopFromBrowser(options);
    if (browserShots.length > 0) {
      return browserShots;
    }
  } catch (browserError) {
    try {
      const fallbackShots = await getTopFromHttpFallback();
      if (fallbackShots.length > 0) {
        return fallbackShots;
      }
    } catch (fallbackError) {
      const browserMessage =
        browserError instanceof Error ? browserError.message : String(browserError);
      const fallbackMessage =
        fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      throw new Error(
        `Failed to scrape Dribbble shots. Browser error: ${browserMessage}. HTTP fallback error: ${fallbackMessage}`
      );
    }
  }

  throw new Error("Failed to scrape Dribbble shots: no shots found");
}
