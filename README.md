# dribbble-top

API for most popular Dribbble shots.

## Runtime

- Bun `>=1.3.5`

## Commands

- `bun install`: install dependencies
- `bun run dev`: start server in watch mode
- `bun run start`: start server
- `bun test`: run tests
- `bun run typecheck`: run strict TypeScript checks
- `bun run audit`: dependency security audit
- `bun run test-script`: run scraper directly

## API

- `GET /` -> `hello!`
- `GET /top` -> `{ ok: true, top: Shot[] }` or `{ ok: false, error: string }`

## Environment Variables

- `PORT`: server port (default `8080`)
- `PUPPETEER_EXECUTABLE_PATH`: custom Chrome/Chromium binary
- `PUPPETEER_DISABLE_SANDBOX`: set `1` or `true` to disable sandbox args
- `PUPPETEER_HEADLESS`: set `0`/`false` to run non-headless mode
