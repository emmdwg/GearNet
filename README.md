# GearNet

**Drive. Build. Connect.**

Automotive social network — garage profiles, explore feed, meets, marketplace, real-time chat, and maintenance logs.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up database (SQLite, zero config)
npm run db:setup

# 3. Start the web app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo login:** `mike@gearnet.app` / `password123`

## What's Included

| Layer | Tech | Status |
|-------|------|--------|
| Web app | Next.js 16, Tailwind 4 | ✅ |
| Auth | NextAuth (credentials) | ✅ |
| Database | Prisma 7 + SQLite (PostgreSQL-ready) | ✅ |
| Real-time chat | Pusher (optional, graceful fallback) | ✅ |
| Image uploads | Cloudinary (optional, URL fallback) | ✅ |
| Mobile app | Expo React Native | ✅ |

## Features

- **Explore Feed** — full-width car photography & technical posts
- **Pit Updates** — 24h garage snapshots
- **Digital Garage** — vehicles, mods, build logs
- **Meet Board** — car meets, cruises, RSVP
- **Parts Exchange** — buy/sell/trade marketplace
- **Cruise Chat** — real-time messaging (Pusher when configured)
- **Service Bench** — maintenance logs & repair manuals

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | SQLite path or PostgreSQL connection string |
| `AUTH_SECRET` | Yes | NextAuth session encryption |
| `NEXTAUTH_URL` | Yes | App URL (http://localhost:3000) |
| `CLOUDINARY_*` | No | Image uploads via Cloudinary |
| `PUSHER_*` | No | Real-time Cruise Chat |
| `NEXT_PUBLIC_PUSHER_*` | No | Client-side Pusher keys |

### PostgreSQL (production)

Change `provider` in `prisma/schema.prisma` to `postgresql` and set:

```
DATABASE_URL="postgresql://user:password@host:5432/gearnet"
```

Then run `npm run db:setup`.

### Cloudinary

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` to `.env`
3. Use the `<ImageUpload />` component or `POST /api/upload`

Without Cloudinary, pass image URLs directly.

### Pusher (real-time chat)

1. Create a free app at [pusher.com](https://pusher.com)
2. Add server keys (`PUSHER_*`) and client keys (`NEXT_PUBLIC_PUSHER_*`) to `.env`
3. Cruise Chat auto-updates in real time

Without Pusher, messages still work via API (send + refresh).

## API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET/POST | `/api/auth/[...nextauth]` | — | NextAuth handlers |
| POST | `/api/auth/register` | — | Create account |
| GET | `/api/me` | — | Current session |
| GET/POST | `/api/posts` | POST ✓ | Explore feed |
| GET | `/api/pit-updates` | — | Pit Updates |
| GET/POST | `/api/events` | POST ✓ | Meet Board |
| POST | `/api/events/[id]/rsvp` | ✓ | RSVP toggle |
| GET/POST | `/api/marketplace` | POST ✓ | Parts Exchange |
| GET/POST | `/api/maintenance` | POST ✓ | Service Bench |
| GET/POST | `/api/conversations` | ✓ | Cruise Chat |
| GET/POST | `/api/conversations/[id]/messages` | ✓ | Messages |
| POST | `/api/upload` | ✓ | Cloudinary upload |
| GET | `/api/users/[username]` | — | Public profile |

## Mobile App (Expo)

Uses **Expo SDK 54** (matches current Expo Go on iPhone).

```bash
# From project root
npm run mobile

# Or from the mobile folder
cd mobile
npm start
```

**Important:** Do not run `npx expo start` from the project root — that starts the wrong project. Always use the `mobile/` folder.

Set `EXPO_PUBLIC_API_URL` in `mobile/.env` to your PC's local IP (not `localhost`) when testing on a physical iPhone:

```
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
```

Make sure the web dev server (`npm run dev`) is also running so the API is available.

## Scripts

```bash
npm run dev          # Start web dev server
npm run build        # Production build
npm run db:setup     # Generate client, push schema, seed data
npm run db:seed      # Re-seed demo data
npm run db:studio    # Open Prisma Studio
```

## Project Structure

```
src/
├── app/              # Pages + API routes
├── components/       # UI by feature
├── lib/
│   ├── auth.ts       # NextAuth config
│   ├── db.ts         # Database queries
│   ├── prisma.ts     # Prisma client
│   ├── pusher.ts     # Real-time chat
│   └── cloudinary.ts # Image uploads
mobile/               # Expo React Native app
prisma/               # Schema + seed
```
