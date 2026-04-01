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

CREATE INDEX idx_events_store_timestamp ON events (store_id, timestamp);
CREATE INDEX idx_events_store_event_type ON events (store_id, event_type);

INSERT INTO events (store_id, event_type, timestamp, product_id, amount, currency)
SELECT
    'store_' || (1 + (i % 3)) AS store_id,
    (ARRAY['page_view', 'add_to_cart', 'remove_from_cart', 'checkout_started', 'purchase'])[1 + (i % 5)] AS event_type,
    NOW() - (random() * INTERVAL '30 days') AS timestamp,
    'product_' || (1 + (i % 50)) AS product_id,
    CASE
        WHEN (ARRAY['page_view', 'add_to_cart', 'remove_from_cart', 'checkout_started', 'purchase'])[1 + (i % 5)] = 'purchase'
        THEN ROUND((10 + random() * 190)::numeric, 2)
        ELSE NULL
    END AS amount,
    'USD' AS currency
FROM generate_series(1, 100000) AS s(i);
