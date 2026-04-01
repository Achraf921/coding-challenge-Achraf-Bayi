# Store Analytics Dashboard

## Setup Instructions

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and **running**
- [Node.js](https://nodejs.org/) >= 18

### 1. Clone the repository

```bash
git clone https://github.com/Achraf921/coding-challenge-Achraf-Bayi.git
cd coding-challenge-Achraf-Bayi
```

### 2. Start the backend services

```bash
docker compose up --build -d
```

This spins up three containers:
- **NestJS API** — `http://localhost:3001`
- **PostgreSQL 18** — port `5433` (database: `analytics`, seeded with 100k events via `init.sql`)
- **Redis 7** — port `6379`

Wait a few seconds for PostgreSQL to finish initializing and seeding.

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

### 4. Verify it works

You should see the dashboard with revenue cards, a top products leaderboard, and a live event stream. Switch between stores using the dropdown in the header.

You can also test the API directly:

```bash
curl -H "x-store-id: store_1" http://localhost:3001/api/v1/analytics/overview?period=month
curl -H "x-store-id: store_2" http://localhost:3001/api/v1/analytics/top-products
curl -H "x-store-id: store_3" http://localhost:3001/api/v1/analytics/recent-activity
```

### Stopping everything

```bash
docker compose down       # stop containers
docker compose down -v    # stop + wipe database volume (fresh seed on next start)
```

### Environment Variables

See `.env.example` for all required variables. Docker Compose provides defaults for local development — no `.env` file needed to run locally.

---

## Architecture Decisions

- 1) No pre-aggregated tables :
Why : This is the one of the things I would have implemented with more time, but for simplicity's sake, we 
used other simpler means such as Cache-aside caching with TTL eviction strategy to reduce the amount of queries to our DB and speed up the answer times, we also used indexes to speed up our SQL queries time (will be detailed later) an aggregated table maybe on daily totals from past days (maybe with a daily CRON Job if the user did not use the dashboard for example) could also make a lot more sense as our tables grow 

- 2) Cache-aside with TTL as eviction policies : This was the simplest way to reduce the number of calls to the DB as we have more users (i.e more employees, if we have a huge company that has 1000 employees for example, we would only query the DB once instead of 1000 times, benefits of this compile as we scale), TTL was set for all endpoints except recent events to still give the feeling that this is live Data (recent events is polled every 5 secs) (verified speed using Postman, cache indeed gives us 10x speed on cache hits).

- 3) Polling : we used polling that matche's our cache's TTL (60 sec for overview, 300secs for top_products 5   secs for recent events), websocket for live display would be overkill.

- 4) Indexes : we chose to only add two composite indexes on (store_id, timestamp) and (store_id, event_type)
    all of our SQL queries select by store_id first so high ROI, store_id, timestamp is used by the recent events endpoint which has no caching + high polling rate so high ROI as well as our data grows (O(log(n)) search time), store_id, even_type is used by top products, tbh not as high ROI as the 1st index as this one gets queried every 300s, debatable decision as it adds an extra O(log(n)) time at write (at 10k events this is totally fine), ,erified index usage with EXPLAIN ANALYZE, queries do use index scan.

- 5) SQL vs NoSQL : though appart of the requirements, when working with highley relatinal data like orders, customers, shops, SQL is always the goto move as JOINs will help us later when working with more tables.

- 6) Multi-Tenancy : though we didn't have time to implement proper auth (with promper JWT validation), I made sure to pass the store_id in the header, in the real world it should be pulled out of a VALID JWT to ensure that people can't take over another user's dashboard.

Both Cache-Aside with TTL & Indexes go towards giving us sub 500ms response times, pre-aggregated table would've been the next step.
    
    

### Data Aggregation Strategy
Live queries, with redis cache-aside, no pre-aggreg tables,

cache aside gives us 10x speed as tested with postman which in our context (B2B SAAS) helps a lot as multiple employees query the same dashboard from the same store (in practice and from my experience interning at a ecom firm, shopify permissions don't just get passed to employees but customers, project managers and such, truly lots of people in real businesses) but as said in all other sections, a daily aggregated table storing the daily total revenue, total events and such would really help.


### Real-time vs. Batch Processing

- Decision: Fully real-time we run all queries towards the events table 
- Why: Simpler architecture, allowed us to build faster/in time, redis still allows us to get 10x speed on cache hits 
- Trade-offs: Simpler to build and maintain but won't survive our scale (+10000 events . s^-1) as table grows, needed for prod in my opinion

### Frontend Data Fetching
- Decision: We fetch data on mount and user polling rates that match our cache's TTL, for recent event, since it doesn't get cached, we just poll every 5s to give a live feel.
- Why: Top products is the least likley to update at high frequence => Higher TLL (300s) => Lower polling rates, the 2nd next being total revenue, we used a lower TTL (60s) and hence a higher polling rate, recent events though is what we use to give the user real time update experience, as we have implemented polling to update the frotend without a refresh, he will see live updates from his store.

### Performance Optimizations
Future potential optimizations :

As mentioned 10x before, I really see the value in adding daily aggregation table with a daily cron job to perform it incase the dashboard wasn't used (this might be an extra step), moreover, one more performance optimization would simply be to split each event type into its own table, reducing the need for a (store_id, event_type) index basically for free.

Existing optimizations : Adequate Polling, Cache, Two composite Indexes to improve ORDER BY notably (called every 5s btw), LIMIT 20 on recent activity


## Known Limitations
Real Authentication and Authorization is not implemented => not usable, as our table grows, our endpoints would struggle (espectially the overview one) without aggregation tables, moreover, the live user implementation we did is not based on accurate data (we guessed an average 5 min time spent on the website with 3 page_visits on average, we have no clue if that behavior is really true, using websocket for that though would've been overkil, maybe better metrics abou user behavior could make the live user feature more accurate)


## What I'd Improve With More Time

1) Aggregated tables
2) Database partitioning for each event type
2) True JWT Auth using Passport
3) Better user behavior model for live users/another solution (maybe websocket but I need to evaluate the cost)
5) Rate limiting on every endpoint

## Time Spent

=~ 3:30/4 hours
