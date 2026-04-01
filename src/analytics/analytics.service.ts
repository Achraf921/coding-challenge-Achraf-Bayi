import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { DATABASE_POOL } from '../database.provider';
import { REDIS_CLIENT } from '../redis.provider';

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async getRecentActivity(storeId: string) {
    const result = await this.pool.query(
      'SELECT * FROM events WHERE store_id = $1 ORDER BY timestamp DESC LIMIT 20',
      [storeId],
    );
    return result.rows;
  }

  private getInterval(period: string): string {
    switch (period) {
      case 'today':
        return '1 day';
      case 'week':
        return '7 days';
      case 'month':
        return '30 days';
      default:
        return '30 days';
    }
  }

  async getOverview(storeId: string, period: string) {
    const cacheKey = `analytics:${storeId}:overview:${period}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const interval = this.getInterval(period);

    const result = await this.pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN event_type = 'purchase' THEN amount ELSE 0 END), 0) AS total_revenue,
         json_object_agg(sub.event_type, sub.count) AS events_by_type,
         CASE
           WHEN SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) = 0 THEN 0
           ELSE ROUND(
             SUM(CASE WHEN event_type = 'purchase' THEN 1 ELSE 0 END)::numeric
             / SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END)::numeric * 100, 2
           )
         END AS conversion_rate
       FROM (
         SELECT event_type, COUNT(*) AS count, SUM(amount) AS amount
         FROM events
         WHERE store_id = $1 AND timestamp >= NOW() - $2::interval
         GROUP BY event_type
       ) sub`,
      [storeId, interval],
    );

    const row = result.rows[0];
    const data = {
      total_revenue: parseFloat(row.total_revenue),
      events_by_type: row.events_by_type,
      conversion_rate: parseFloat(row.conversion_rate),
      period,
      store_id: storeId,
    };

    await this.redis.set(cacheKey, JSON.stringify(data), 'EX', 60);
    return data;
  }

  async getTopProducts(storeId: string) {
    const cacheKey = `analytics:${storeId}:top-products`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const result = await this.pool.query(
      `SELECT product_id, SUM(amount) AS total_revenue, COUNT(*) AS purchase_count
       FROM events
       WHERE store_id = $1 AND event_type = 'purchase'
       GROUP BY product_id
       ORDER BY total_revenue DESC
       LIMIT 10`,
      [storeId],
    );

    await this.redis.set(cacheKey, JSON.stringify(result.rows), 'EX', 300);
    return result.rows;
  }
}
