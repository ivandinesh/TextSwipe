# FocusFeed

FocusFeed is a full-stack TypeScript app for swipe-based learning. Enter a topic, generate a deck of concise AI-curated cards, and keep exploring through related topic branches in a dark-first editorial UI built for mobile reading and fast navigation.

## Highlights

- Vertical swipe learning flow with keyboard support
- OpenRouter-backed content generation with fallback content handling
- Related-topic suggestions after each generated deck
- Dark-first "editorial neon" UI with glass surfaces and responsive reading layout
- Local topic personalization via browser storage, plus mounted topic/chat API routes
- Express rate limiting on generation endpoints

## Stack

- Frontend: React, Vite, Tailwind CSS, Framer Motion, Radix UI
- Backend: Express, TypeScript, OpenRouter API integration
- Data: Drizzle ORM with PostgreSQL-compatible setup, memory/dev fallback paths
- Tooling: `tsx`, `esbuild`, `vite`, `typescript`

## Requirements

- Node.js 18+
- npm
- `OPENROUTER_API_KEY` for AI generation
- Optional PostgreSQL-compatible `DATABASE_URL` if you want DB-backed topic/chat routes

## Environment

Create a `.env` file in the project root.

Minimum local development variables:

```env
NODE_ENV=development
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=google/gemini-2.5-flash-lite
PORT=5000
SESSION_SECRET=replace_me_for_production
GENERATION_RATE_LIMIT_MAX_REQUESTS=10
GENERATION_RATE_LIMIT_WINDOW_MS=900000
TOPIC_CACHE_ENABLED=true
TOPIC_CACHE_DIR=cache
```

Optional variables:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/focusfeed
APP_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

Notes:

- `APP_ALLOWED_ORIGINS` is only used in production.
- In production, the app expects `NODE_ENV`, `OPENROUTER_API_KEY`, and `SESSION_SECRET`.
- `OPENROUTER_MODEL` is optional in code, but recommended in env so you can switch providers/models without editing the server.
- `GENERATION_RATE_LIMIT_MAX_REQUESTS` controls how many generation requests are allowed per rate-limit window.
- `GENERATION_RATE_LIMIT_WINDOW_MS` controls the rate-limit window length in milliseconds.
- With the current UI generating 10 cards per request, `GENERATION_RATE_LIMIT_MAX_REQUESTS=10` is effectively about 100 cards per window.
- `TOPIC_CACHE_ENABLED` turns the persistent topic cache on or off.
- `TOPIC_CACHE_DIR` sets the cache root directory; the app stores one JSON file per topic under `topics/` plus a `topic-index.json` lookup file.

## Install

```bash
npm install
```

## Run Locally

Start the app in development mode:

```bash
npm run dev
```

Default local server:

- App/API: [http://localhost:5000](http://localhost:5000)

Useful checks:

```bash
npm run check
npm run build
```

## API Overview

### `POST /api/generate`

Generates a deck payload for the swipe view.

Example request:

```json
{
  "topic": "Quantum Computing",
  "count": 10,
  "generateOptions": true
}
```

Example response:

```json
{
  "cards": [
    { "content": "Quantum bits can represent more than one state at once." }
  ],
  "options": [
    {
      "title": "Quantum Error Correction",
      "description": "Learn how fragile quantum information is stabilized."
    }
  ]
}
```

### `POST /api/generate-content`

Generates a card list for the main client flow.

Example response:

```json
{
  "success": true,
  "snippets": [
    "Quantum bits can represent more than one state at once."
  ],
  "options": [
    {
      "title": "Quantum Error Correction",
      "description": "Learn how fragile quantum information is stabilized."
    }
  ]
}
```

### Other mounted routes

- `GET /api/health`
- `POST /api/topic-interactions`
- `GET /api/popular-topics`
- `GET /api/global-popular-topics`
- `GET /api/chats`
- `POST /api/chats`

## UI Notes

The current UI is intentionally:

- Dark-first
- Mobile-first
- Reading-focused
- High-contrast with restrained neon accents

The main visual work lives in:

- `client/src/index.css`
- `client/src/components/FocusFeed.tsx`
- `client/src/components/SwipeContainer.tsx`
- `client/src/components/SwipeCard.tsx`
- `client/src/components/OptionsCard.tsx`

## Project Structure

```text
client/   React frontend
server/   Express server and API routes
shared/   Shared schema/types
dist/     Production build output
```

## Deployment

Production build:

```bash
npm run build
npm run start
```

The server serves the built frontend from `dist/public` and the API from the same Express process.

## Current Caveats

- Topic/chat persistence is partially DB-aware, but some routes are still most useful with a configured database.
- There are a few legacy dependencies and server-side experiments still present in `package.json`; the active generation path is OpenRouter-based.

## License

MIT
