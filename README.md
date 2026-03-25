# FocusFeed

FocusFeed is a full-stack TypeScript app for swipe-based learning. Enter a topic, get a 10-card AI-generated deck, swipe through one idea at a time, then branch into related follow-up topics. The current product includes account support, a personal dashboard, persistent topic caching, and a dark-first reading UI optimized for mobile and desktop.

## What It Does

- Generates swipeable learning decks for any topic
- Suggests follow-up branches after each 10-card session
- Supports account registration with email + password
- Saves liked cards, learning sessions, and topic interactions for signed-in users
- Shows a personal dashboard with learning minutes, streaks, saved cards, and recommended topics
- Persists generated topic decks to disk so repeat topics can be served from cache
- Supports card favorites via heart button and double tap
- Uses swipe-up controls in the reading view for theme, font, and text contrast tuning
- Uses OpenRouter with an env-configurable model, defaulting to `google/gemini-2.5-flash-lite`

## Stack

- Frontend: React, Vite, Tailwind CSS, Framer Motion, Radix UI, Wouter
- Backend: Express, TypeScript
- Data: Drizzle ORM with PostgreSQL support and in-memory fallback paths for some flows
- AI: OpenRouter chat completions
- Build tools: `vite`, `esbuild`, `tsx`, `typescript`

## Requirements

- Node.js 18+
- npm
- OpenRouter API key
- PostgreSQL for production account/dashboard persistence

## Environment Variables

Create a `.env` file in the project root.

Example local setup:

```env
PORT=5000
NODE_ENV=development

OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=google/gemini-2.5-flash-lite

SESSION_SECRET=replace-with-a-long-random-secret

GENERATION_RATE_LIMIT_MAX_REQUESTS=10
GENERATION_RATE_LIMIT_WINDOW_MS=900000

TOPIC_CACHE_ENABLED=true
TOPIC_CACHE_DIR=cache

DATABASE_URL=postgresql://user:password@localhost:5432/focusfeed
APP_ALLOWED_ORIGINS=https://focusfeed.me,https://www.focusfeed.me
```

Notes:

- `OPENROUTER_MODEL` lets you switch providers/models without changing code.
- `SESSION_SECRET` is required in production because auth uses cookie sessions.
- `DATABASE_URL` is required in production if you want account, dashboard, likes, and learning history to persist in Postgres.
- `APP_ALLOWED_ORIGINS` is only used in production.
- `GENERATION_RATE_LIMIT_MAX_REQUESTS` and `GENERATION_RATE_LIMIT_WINDOW_MS` control the current generation window.
- `TOPIC_CACHE_DIR` stores one JSON file per cached topic plus `topic-index.json`.
- Do not commit real secrets to source control.

## Install

```bash
npm install
```

## Development

Run the app:

```bash
npm run dev
```

Useful checks:

```bash
npm run check
npm run build
```

Default local URL:

- App + API: [http://localhost:5000](http://localhost:5000)

## Database Setup

The app uses Drizzle with PostgreSQL.

To apply the current schema:

```bash
npm run db:push
```

Current schema includes support for:

- `users`
- `learning_sessions`
- `user_liked_cards`
- `user_topic_interactions`
- `chats`
- `chat_cards`

If you are deploying auth/dashboard for the first time, make sure `DATABASE_URL` is set before running `npm run db:push`.

## API Overview

### `POST /api/generate`

Returns deck-shaped card data for the swipe flow.

Example request:

```json
{
  "topic": "Renewable Energy",
  "count": 10,
  "generateOptions": true
}
```

Example response:

```json
{
  "cards": [
    { "content": "Renewable energy comes from natural sources that replenish themselves." }
  ],
  "options": [
    {
      "title": "Solar Storage",
      "description": "Learn how renewable power is stored for later use."
    }
  ]
}
```

### `POST /api/generate-content`

Returns the snippet array used by the main learning flow.

Example response:

```json
{
  "success": true,
  "snippets": [
    "Renewable energy comes from natural sources that replenish themselves."
  ],
  "options": [
    {
      "title": "Solar Storage",
      "description": "Learn how renewable power is stored for later use."
    }
  ]
}
```

### Auth Routes

- `GET /api/auth/me`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Dashboard Routes

- `GET /api/dashboard/summary`
- `GET /api/dashboard/liked-cards`
- `GET /api/dashboard/recommended-topics`
- `POST /api/dashboard/learning-sessions`
- `POST /api/dashboard/liked-cards`
- `POST /api/dashboard/topic-interactions`

### Other Routes

- `GET /api/health`
- `POST /api/topic-interactions`
- `GET /api/popular-topics`
- `GET /api/global-popular-topics`
- `GET /api/chats`
- `POST /api/chats`

## Topic Cache

FocusFeed includes a persistent server-side topic cache.

Behavior:

- Cache key uses normalized topic + model + count + option mode
- One file is stored per topic entry
- Metadata is stored in `topic-index.json`
- Successful generations are written to memory and disk
- Repeat requests for the same normalized topic/settings can be served without calling the AI again

Default layout:

```text
cache/
  topic-index.json
  topics/
    renewable-energy--a1b2c3d4.json
```

## UI Notes

The current UI is designed to be:

- Dark-first
- Reading-focused
- Mobile-friendly
- Minimal on the homepage
- Immersive in the card view, with swipe-up controls and persistent in-card progress labels

Current card-view behavior:

- Swipe right to move to the next card
- Swipe left to go to the previous card
- Tap the heart or double tap the card to favorite it
- Swipe up to open the reading controls sheet
- Swipe down or dismiss the sheet to close it
- Card position is shown inside the card itself rather than in the top chrome

Theme/font/text controls exist in the reading view, and the card surfaces now change with the active theme. The current visual direction is high-contrast dark mode with soft pastel scene backgrounds and glows.

## Project Structure

```text
client/   React frontend
server/   Express server, API routes, auth, AI integration, topic cache
shared/   Shared database schema and types
dist/     Production build output
```

## Production Deployment

Typical production flow:

```bash
npm install
npm run build
npm run db:push
npm run start
```

If you use PM2, restart the process after build/env changes.

Important production notes:

- The app expects HTTPS in production because session cookies are `secure`.
- Set `APP_ALLOWED_ORIGINS` to your real domain(s).
- Set `DATABASE_URL` before `npm run db:push`.
- The repo no longer depends on the unused `@tailwindcss/vite` or `openai` packages, which were removed to avoid production install conflicts.

## Troubleshooting

### `npm install` peer dependency errors

If you still see old peer-resolution errors on a server, make sure the server has the latest committed `package.json` and `package-lock.json` after pulling recent changes.

### `npm run build` works locally but not in this Codex environment

Some local build attempts in the sandbox can fail with `spawn EPERM`. That is an execution-environment restriction here, not a project build issue. The project build itself has been verified successfully.

## License

MIT
