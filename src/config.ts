interface AppConfig {
  port: number;
  cacheTtlMs: number;
  puppeteerDisableSandbox: boolean;
  puppeteerHeadless: boolean;
  puppeteerExecutablePath: string | undefined;
}

function parsePort(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const normalized = value.toLowerCase();
  if (normalized === "1" || normalized === "true") return true;
  if (normalized === "0" || normalized === "false") return false;
  return fallback;
}

export function getConfig(env: Record<string, string | undefined> = Bun.env): AppConfig {
  const executablePath = env.PUPPETEER_EXECUTABLE_PATH;
  return {
    port: parsePort(env.PORT, 8080),
    cacheTtlMs: 10 * 60 * 1000,
    puppeteerDisableSandbox: parseBool(env.PUPPETEER_DISABLE_SANDBOX, process.platform === "linux"),
    puppeteerHeadless: parseBool(env.PUPPETEER_HEADLESS, true),
    puppeteerExecutablePath: executablePath && executablePath.length > 0 ? executablePath : undefined,
  };
}
