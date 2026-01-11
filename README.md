# TextSwipe - Text-Based Swipe Learning App

TextSwipe is a full-stack TypeScript monorepo app inspired by TikTok-style scrolling cards, delivering AI-curated educational content for quick, engaging learning sessions. Users swipe through text-based cards on various topics, with real-time generation and personalization.

Live Demo: [focusfeed.me](https://focusfeed.me) (Hosted on Oracle Free Tier with HTTPS).

## Features
- **Swipe Interface**: Intuitive card swiping with Framer Motion animations.
- **AI Content Generation**: Gemini AI (via Google Generative AI) creates dynamic cards based on user-selected topics.
- **Authentication**: Passport.js for user sessions.
- **Database**: Postgres with Drizzle ORM for storing users, sessions, and future chat data.
- **Real-Time**: WebSockets for live updates.
- **Production Ready**: Static frontend serving, PM2 process manager, Nginx reverse proxy with HTTPS.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS (v3.4.13), Radix UI, TanStack Query, Framer Motion.
- **Backend**: Express.js, Passport.js, Drizzle ORM (Postgres), @google/generative-ai (Gemini model: gemini-2.5-flash).
- **Shared**: Zod for validation.
- **Build/Dev Tools**: esbuild/tsx for backend, Vite for frontend bundling.
- **Deployment**: Oracle Free Tier (Ubuntu VM), PM2, Nginx, Certbot for SSL.
- **Dependencies**: Node.js 18+, Postgres, Gemini API key.

## Installation
1. Clone the repo: `git clone https://github.com/ivandinesh/TextSwipe.git`.
2. Navigate: `cd TextSwipe`.
3. Install deps: `npm install`.
4. Set up env: Copy `.env.example` to `.env` and fill in `GEMINI_API_KEY`, `DATABASE_URL` (e.g., postgresql://user:pass@localhost:5432/db), `SESSION_SECRET`.

## Running Locally
- Dev mode: `npm run dev` (Frontend: http://localhost:5173, Backend: http://localhost:5000).
- Build prod: `npm run build` (creates dist/public for static assets).
- Run prod: `npm run start` (or use PM2: `pm2 start ecosystem.config.cjs`).

## Database Setup
- Install Postgres locally or use Neon/Supabase.
- Run migrations: `npx drizzle-kit generate:pg && npx drizzle-kit migrate`.
- Schema: Users, sessions (more tables planned for multiple chats).

## Deployment
- **Oracle VM**: Free Tier E2.Micro (Ubuntu), IP 79.76.32.221. Clone repo, install Node/Postgres, run PM2.
- **Nginx**: Config for HTTPS redirect/proxy to port 5000. Use Certbot for SSL.
- **Domain**: Point A record to VM IP (e.g., focusfeed.me via Strato).
- **CI/CD**: Planned with GitHub Actions (SSH deploy).

## Known Changes from Original
- AI swapped from OpenAI to Gemini for cost/efficiency (with fallback on errors).
- Build fixes: Tailwind downgrade, PostCSS config, ESM polyfills.
- Security: .gitignore enhanced for .env/logs/secrets.
- Hosting: Oracle with iptables/UFW tweaks.

## Forward Plan
- **Milestone 2: Multiple Chats**: Add chats table (id, user_id, topic), API routes, UI list component, persist cards per chat.
- **Milestone 3: Scaling**: Redis cache, user profiles, rate-limiting, Google Analytics, PWA push.
- **Milestone 4: Maintenance**: Jest tests, Sentry monitoring, Stripe integration, backups.

## Contributing
Fork the repo, create a branch (e.g., `git checkout -b feature/multi-chats`), commit changes, push, and open a PR. Use Zed/VS Code with OpenRouter AI for assistance.

## License
MIT License (see LICENSE file for details).

For issues, open a GitHub ticket. Contributions welcome!
