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

  test("drops malformed entries missing required keys", () => {
    expect(normalizeShot({ id: "1", img: null, url: "https://dribbble.com" })).toBeNull();
    expect(normalizeShot({ id: "1", img: "https://cdn", url: null })).toBeNull();
  });
});
