# Flash - Live Auction Platform

A real-time auction platform with live bidding, chat, and seller streaming.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Zustand, TanStack Query
- **Backend**: Node.js, Express, Socket.io
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Supabase Auth
- **Payments**: Stripe

## Project Structure

```
flash/
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared Zod schemas
└── package.json     # Monorepo workspace config
```

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL database
- Supabase account
- Stripe account

### Installation

```bash
# Install all dependencies
npm install

# Set up environment variables
cp server/.env.example server/.env
# Edit server/.env with your credentials

# Run database migrations
npm run db:migrate

# Seed the database (optional)
npm run db:seed
```

### Development

```bash
# Run both client and server
npm run dev

# Run only client
npm run dev:client

# Run only server
npm run dev:server
```

## Environment Variables

See `server/.env.example` for required environment variables.
