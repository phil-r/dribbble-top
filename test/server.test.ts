import { afterEach, describe, expect, test } from "bun:test";

import { startServer } from "../src/server";
import type { Shot } from "../src/types";

const servers: Bun.Server<unknown>[] = [];

afterEach(() => {
  for (const server of servers) {
    server.stop(true);
  }
  servers.length = 0;
});

describe("server routes", () => {
  test("GET / returns hello", async () => {
    const server = startServer({
      port: 0,
      getTopImpl: async () => [],
    });
    servers.push(server);

    const response = await fetch(`${server.url}/`);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toBe("hello!");
  });

  test("GET /top returns ok true payload", async () => {
    const top: Shot[] = [
      {
        id: 123,
        img: "https://cdn.dribbble.com/image.webp",
        video: null,
        url: "https://dribbble.com/shots/123-example",
        likes: 10,
        comments: 1,
        viewsString: "100",
        title: "Example",
        author: {
          name: "Jane",
          url: "https://dribbble.com/jane",
        },
      },
    ];

    const server = startServer({
      port: 0,
      getTopImpl: async () => top,
    });
    servers.push(server);

    const response = await fetch(`${server.url}/top`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, top });
  });

  test("GET /top returns ok false on scraper error", async () => {
    const server = startServer({
      port: 0,
      getTopImpl: async () => {
        throw new Error("scrape failed");
      },
    });
    servers.push(server);

    const response = await fetch(`${server.url}/top`);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ ok: false, error: "scrape failed" });
  });

  test("non-GET /top returns 405 and does not run scraper", async () => {
    let calls = 0;
    const server = startServer({
      port: 0,
      getTopImpl: async () => {
        calls += 1;
        return [];
      },
    });
    servers.push(server);

    const response = await fetch(`${server.url}/top`, { method: "POST" });
    const body = await response.text();

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET");
    expect(body).toBe("Method Not Allowed");
    expect(calls).toBe(0);
  });
});
