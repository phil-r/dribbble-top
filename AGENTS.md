# Repository Guidelines

## Project Structure & Module Organization
This repo is a Node.js API that returns top Dribbble shots.

- `index.js`: Polka server and HTTP routes (`/`, `/top`).
- `drib.js`: scraping pipeline (Puppeteer first, HTTP+Cheerio fallback) and shot normalization.
- `test/drib.test.js`: unit tests for normalization contract.
- `test-script.js`: manual scraper smoke runner.
- `package.json`: scripts, Node runtime policy, and dependencies.

Keep route logic thin. Put scraping and parsing behavior in `drib.js`-style modules.

## Build, Test, and Development Commands
- `npm install`: install/update dependencies.
- `npm start`: run API locally (default `PORT=8080`).
- `npm test`: run unit tests (`node --test "test/**/*.test.js"`).
- `npm run test-script`: run a manual live scrape check.
- `npm audit --omit=dev`: check production dependency vulnerabilities.

Example:

```bash
PORT=8080 npm start
curl http://localhost:8080/top
```

## Coding Style & Naming Conventions
- Use ES modules only (`import`/`export`).
- Follow existing style: 2-space indentation, semicolons, camelCase identifiers.
- Use lowercase file names (for example, `drib.js`).
- Preserve API response keys in normalizers: `id`, `img`, `video`, `url`, `likes`, `comments`, `viewsString`, `title`, `author`.

No formatter/linter is configured; keep style consistent with surrounding code.

## Testing Guidelines
- Add tests under `test/` with `*.test.js` names.
- Prioritize contract tests for payload shape and parser defaults.
- After scraper changes, run both:
  - `npm test` (fast regression)
  - `npm run test-script` (live scrape behavior)

## Commit & Pull Request Guidelines
Prefer short imperative commit subjects (for example, `Fix scraper fallback`, `Update deps`).

- Keep each commit focused on one logical change.
- PRs should include: intent, behavior changes, verification commands run, and relevant sample output for `/top`.

## Runtime & Environment Notes
- Supported runtime: Node `>=22`.
- Optional env vars:
  - `PORT`: HTTP port.
  - `PUPPETEER_EXECUTABLE_PATH`: custom Chromium/Chrome binary.
  - `PUPPETEER_DISABLE_SANDBOX=1`: disable Chromium sandbox when required by host.
  - `PUPPETEER_HEADLESS=false`: run non-headless for local debugging.
