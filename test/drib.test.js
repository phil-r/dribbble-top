import test from "node:test";
import assert from "node:assert/strict";

import { normalizeShot } from "../drib.js";

test("normalizeShot keeps the existing API shape", () => {
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

  assert.deepEqual(shot, {
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

test("normalizeShot falls back to id parsed from URL", () => {
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

  assert.equal(shot.id, 67890);
  assert.equal(shot.likes, 0);
  assert.equal(shot.comments, 0);
  assert.equal(shot.viewsString, "0");
  assert.equal(shot.title, "");
  assert.deepEqual(shot.author, {
    name: "",
    url: "",
  });
});

test("normalizeShot drops malformed entries missing required keys", () => {
  assert.equal(normalizeShot({ id: "1", img: null, url: "https://dribbble.com" }), null);
  assert.equal(normalizeShot({ id: "1", img: "https://cdn", url: null }), null);
  assert.equal(normalizeShot(null), null);
});
