# Repository Guidelines

## Project Structure & Module Organization
This repo is a Bun + TypeScript API that returns top Dribbble shots.

- `src/server.ts`: `Bun.serve` entrypoint and route handling (`/`, `/top`).
- `src/scraper/`: browser scraper, HTTP fallback, and normalization logic.
- `src/cache.ts`: typed TTL cache used by `/top`.
- `src/config.ts`: environment parsing and runtime defaults.
- `src/types.ts`: shared API and scraper types.
- `test/`: Bun tests (`*.test.ts`) for normalization, cache, and routes.

Keep route logic thin and place scraping/parsing logic in `src/scraper/`.

## Build, Test, and Development Commands
- `bun install`: install dependencies and lockfile.
- `bun run dev`: run server with watch mode.
- `bun run start`: run server normally.
- `bun test`: run the test suite.
- `bun run typecheck`: strict TypeScript checks (`tsc --noEmit`).
- `bun run audit`: dependency vulnerability scan.
- `bun run test-script`: manual live scraper smoke check.

Example:

```bash
PORT=8080 bun run start
curl http://localhost:8080/top
```

## Coding Style & Naming Conventions
- Use strict TypeScript with explicit types; avoid `any`.
- Use ES modules and 2-space indentation.
- Prefer small, composable modules (`normalize`, `browser`, `fallback`).
- Preserve response keys for `Shot`: `id`, `img`, `video`, `url`, `likes`, `comments`, `viewsString`, `title`, `author`.

## Testing Guidelines
- Place tests in `test/` and name files `*.test.ts`.
- Use `bun:test` APIs (`describe`, `test`, `expect`).
- Cover parser/normalizer contract behavior and route responses.
- For scraper changes, run both `bun test` and `bun run test-script`.

## Commit & Pull Request Guidelines
Use concise, imperative commit subjects (for example, `Migrate server to Bun.serve`).

- Keep commits focused on one logical change.
- PRs should include intent, changed behavior, and verification commands run.
- For `/top` changes, include a response example.

## Runtime & Environment Notes
- Runtime: Bun `>=1.3.5`.
- Optional env vars: `PORT`, `PUPPETEER_EXECUTABLE_PATH`, `PUPPETEER_DISABLE_SANDBOX`, `PUPPETEER_HEADLESS`.
