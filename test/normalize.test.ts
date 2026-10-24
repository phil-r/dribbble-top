import { describe, expect, test } from "bun:test";

import { normalizeShot } from "../src/scraper/normalize";

describe("normalizeShot", () => {
  test("keeps the existing API shape", () => {
    const shot = normalizeShot({
      id: "12345",
      img: "https://cdn.dribbble.com/shot.png&compress=1",
      video: "https://cdn.dribbble.com/shot.mp4",
      url: "https://dribbble.com/shots/12345-example",
      likes: "1,234",
      comments: "12",
      viewsString: "99.9k",
      title: "Example",
      author: {
        name: "Jane",
        url: "https://dribbble.com/jane",
      },
    });

    expect(shot).toEqual({
      id: 12345,
      img: "https://cdn.dribbble.com/shot.png&compress=1",
      video: "https://cdn.dribbble.com/shot.mp4",
      url: "https://dribbble.com/shots/12345-example",
      likes: 1234,
      comments: 12,
      viewsString: "99.9k",
      title: "Example",
      author: {
        name: "Jane",
        url: "https://dribbble.com/jane",
      },
    });
  });

  test("falls back to id parsed from URL", () => {
    const shot = normalizeShot({
      id: "",
      img: "https://cdn.dribbble.com/shot.png",
      url: "https://dribbble.com/shots/67890-another",
      likes: null,
      comments: undefined,
      viewsString: "",
      title: null,
      author: {},
    });

    expect(shot).toEqual({
      id: 67890,
      img: "https://cdn.dribbble.com/shot.png",
      video: null,
      url: "https://dribbble.com/shots/67890-another",
      likes: 0,
      comments: 0,
      viewsString: "0",
      title: "",
      author: {
        name: "",
        url: "",
      },
    });
  });

  test.each([
    ["1.2k", 1200],
    ["2K", 2000],
    ["2M", 2000000],
    ["1.5m", 1500000],
    [" \t1.2K\n", 1200],
    [" 2.5M ", 2500000],
    ["1234", 1234],
    [1234, 1234],
    ["1,234", 1234],
    ["2,345,678", 2345678],
    [0, 0],
    ["0", 0],
    [null, 0],
    [undefined, 0],
    ["", 0],
    ["   ", 0],
  ] as const)("normalizes likes and comments %j to %i", (value, expected) => {
    const shot = normalizeShot({
      id: "12345",
      img: "https://cdn.dribbble.com/shot.png",
      url: "/shots/12345-example",
      likes: value,
      comments: value,
      viewsString: "99.9k",
    });

    expect(shot?.likes).toBe(expected);
    expect(shot?.comments).toBe(expected);
    expect(shot?.viewsString).toBe("99.9k");
  });

  test.each([
    ["12345", 12345],
    [12345, 12345],
    ["12,345", 12345],
    ["1.2k", 12],
    ["2M", 2],
    ["", 67890],
    [null, 67890],
    [undefined, 67890],
    [0, 67890],
    ["invalid", 67890],
  ] as const)("preserves ID parsing and URL fallback for %j", (id, expected) => {
    const shot = normalizeShot({
      id,
      img: "https://cdn.dribbble.com/shot.png",
      url: "/shots/67890-example",
      likes: "1.2k",
      comments: "2M",
    });

    expect(shot?.id).toBe(expected);
    expect(shot?.likes).toBe(1200);
    expect(shot?.comments).toBe(2000000);
  });

  test("drops malformed entries missing required keys", () => {
    expect(normalizeShot({ id: "1", img: null, url: "https://dribbble.com" })).toBeNull();
    expect(normalizeShot({ id: "1", img: "https://cdn", url: null })).toBeNull();
  });
});
