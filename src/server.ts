import { createTtlCache } from "./cache";
import { getConfig } from "./config";
import { getTop } from "./scraper";
import type { Shot, TopErrorResponse, TopSuccessResponse } from "./types";

export type GetTopFn = () => Promise<Shot[]>;

function jsonResponse(body: TopSuccessResponse | TopErrorResponse, status = 200): Response {
  return Response.json(body, { status });
}

export function createHandler(getTopImpl: GetTopFn): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const { pathname } = new URL(request.url);
    const method = request.method.toUpperCase();

    if ((pathname === "/" || pathname === "/top") && method !== "GET") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { Allow: "GET" },
      });
    }

    if (pathname === "/") {
      return new Response("hello!");
    }

    if (pathname === "/top") {
      try {
        const top = await getTopImpl();
        return jsonResponse({ ok: true, top }, 200);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return jsonResponse({ ok: false, error: message }, 500);
      }
    }

    return new Response("Not Found", { status: 404 });
  };
}

export interface StartServerOptions {
  port?: number;
  getTopImpl?: GetTopFn;
}

export function startServer(options: StartServerOptions = {}): Bun.Server<unknown> {
  const config = getConfig();

  const scraper =
    options.getTopImpl ||
    (() =>
      getTop({
        disableSandbox: config.puppeteerDisableSandbox,
        headless: config.puppeteerHeadless,
        executablePath: config.puppeteerExecutablePath,
      }));

  const cachedGetTop = createTtlCache(scraper, config.cacheTtlMs);
  const handler = createHandler(cachedGetTop);

  const server = Bun.serve({
    port: options.port ?? config.port,
    fetch: handler,
  });

  console.log(`> Running on http://localhost:${server.port}`);
  return server;
}

if (import.meta.main) {
  startServer();
}
