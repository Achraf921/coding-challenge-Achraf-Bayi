# Amboras Analytics Dashboard

Real-time store analytics dashboard built with NestJS, Next.js, PostgreSQL, and Redis.

## Architecture

```
repo/
├── backend/          # NestJS API (TypeScript)
├── frontend/         # Next.js dashboard (TypeScript)
├── docker-compose.yml
├── init.sql          # DB schema + 100k seed events
└── .env.example
```

**Backend:** NestJS REST API with PostgreSQL (pg driver) and Redis (ioredis) for cache-aside caching.

**Frontend:** Next.js app with Recharts, polling-based live updates, and date range filtering.

**Database:** PostgreSQL 18 with composite indexes on `(store_id, timestamp)` and `(store_id, event_type)`.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running)
- [Node.js](https://nodejs.org/) >= 18

## Quick Start

### 1. Clone and start backend services

```bash
git clone https://github.com/Achraf921/coding-challenge-Achraf-Bayi.git
cd coding-challenge-Achraf-Bayi
docker compose up --build -d
```

This starts:
- **NestJS API** on `http://localhost:3001`
- **PostgreSQL 18** on port `5433` (with `analytics` database + 100k seeded events)
- **Redis 7** on port `6379`

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard available at `http://localhost:3000`

## API Endpoints

All endpoints require the `x-store-id` header (e.g., `store_1`, `store_2`, `store_3`).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/analytics/recent-activity` | 20 most recent events |
| GET | `/api/v1/analytics/overview?period=today\|week\|month` | Revenue, conversion rate, events by type |
| GET | `/api/v1/analytics/overview?start=ISO&end=ISO` | Custom date range overview |
| GET | `/api/v1/analytics/top-products` | Top 10 products by revenue |

### Example

```bash
curl -H "x-store-id: store_1" http://localhost:3001/api/v1/analytics/overview?period=month
```

## Caching Strategy

Cache-aside pattern with Redis TTL-based eviction:

| Endpoint | Cache TTL | Frontend Poll |
|----------|-----------|---------------|
| recent-activity | None | 5s |
| overview | 60s | 60s |
| top-products | 300s | 300s |

## Environment Variables

See `.env.example` for all required variables. Docker Compose provides defaults for local development.

## Tech Stack

- **Backend:** NestJS, PostgreSQL 18, Redis 7, ioredis, class-validator
- **Frontend:** Next.js, React, Recharts, TypeScript
- **Infrastructure:** Docker Compose

## Author

Achraf Bayi
