import { describe, expect, test } from "bun:test";

import { createTtlCache } from "../src/cache";

describe("createTtlCache", () => {
  test("returns cached value inside TTL", async () => {
    let calls = 0;
    const cached = createTtlCache(async () => {
      calls += 1;
      return `value-${calls}`;
    }, 1000);

    const first = await cached();
    const second = await cached();

    expect(first).toBe("value-1");
    expect(second).toBe("value-1");
    expect(calls).toBe(1);
  });

  test("shares in-flight request", async () => {
    let calls = 0;
    const cached = createTtlCache(async () => {
      calls += 1;
      await Bun.sleep(50);
      return calls;
    }, 1000);

    const [first, second] = await Promise.all([cached(), cached()]);

    expect(first).toBe(1);
    expect(second).toBe(1);
    expect(calls).toBe(1);
  });

  test("refreshes value after TTL", async () => {
    let calls = 0;
    const cached = createTtlCache(async () => {
      calls += 1;
      return calls;
    }, 5);

    const first = await cached();
    await Bun.sleep(10);
    const second = await cached();

    expect(first).toBe(1);
    expect(second).toBe(2);
    expect(calls).toBe(2);
  });
});
