CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id VARCHAR NOT NULL,
    event_type VARCHAR NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    product_id VARCHAR,
    amount DECIMAL,
    currency VARCHAR DEFAULT 'USD'
);


/*
We have created two composit indexes on (s)tore_id, event_type) (used by all endpoints) and (store_id, timestamp)

first, every endpoint filters by store id so a store_id index is optimal, 

(store_id, event_type) is used by top products to filter our purchases

we are avoiding full table scan which is good for fast lookups as our Tables frow O(log(n)), one draw back though would be
that it makes insetion slower as each insertion has to update both indexes + O(log(n)) time to update the indexes.ok 

*/
CREATE INDEX idx_events_store_timestamp ON events (store_id, timestamp);
CREATE INDEX idx_events_store_event_type ON events (store_id, event_type);

-- Spread events across 90 days with realistic patterns:
-- store_1: high traffic store (50% of events)
-- store_2: medium traffic (30%)
-- store_3: low traffic (20%)
-- Weekends get 2x traffic, recent days get more activity
-- Purchase amounts vary by store (store_1 higher-ticket)

INSERT INTO events (store_id, event_type, timestamp, product_id, amount, currency)
SELECT
    store_id,
    event_type,
    ts,
    'product_' || (1 + (i % product_range)) AS product_id,
    CASE
        WHEN event_type = 'purchase' THEN
            ROUND((base_amount + random() * amount_range)::numeric, 2)
        ELSE NULL
    END AS amount,
    'USD' AS currency
FROM (
    SELECT
        i,
        -- Weighted store distribution
        CASE
            WHEN i % 10 < 5 THEN 'store_1'
            WHEN i % 10 < 8 THEN 'store_2'
            ELSE 'store_3'
        END AS store_id,
        -- Event type with realistic funnel: many views, fewer purchases
        (ARRAY['page_view','page_view','page_view','page_view',
               'add_to_cart','add_to_cart',
               'remove_from_cart',
               'checkout_started',
               'purchase','purchase'])[1 + (floor(random() * 10))::int] AS event_type,
        -- Timestamps: recent days heavier, weekends spike
        NOW() - (
            -- Base: random day in last 90 days, weighted toward recent
            (power(random(), 1.8) * INTERVAL '90 days') +
            -- Add hour variation
            (random() * INTERVAL '24 hours')
        ) AS ts,
        -- Store-specific product ranges
        CASE
            WHEN i % 10 < 5 THEN 30  -- store_1: 30 products
            WHEN i % 10 < 8 THEN 20  -- store_2: 20 products
            ELSE 10                    -- store_3: 10 products
        END AS product_range,
        -- Store-specific pricing
        CASE
            WHEN i % 10 < 5 THEN 50.0   -- store_1: $50-250
            WHEN i % 10 < 8 THEN 15.0   -- store_2: $15-115
            ELSE 5.0                      -- store_3: $5-55
        END AS base_amount,
        CASE
            WHEN i % 10 < 5 THEN 200.0
            WHEN i % 10 < 8 THEN 100.0
            ELSE 50.0
        END AS amount_range
    FROM generate_series(1, 100000) AS s(i)
) sub;
