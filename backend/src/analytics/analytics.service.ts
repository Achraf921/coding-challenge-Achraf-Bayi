import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { DATABASE_POOL } from '../database.provider';
import { REDIS_CLIENT } from '../redis.provider';

/*all of our SQL Queries/business logic is here*/

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

  async getOverview(storeId: string, period?: string, start?: string, end?: string) {
    const useCustomRange = start && end;
    const cacheKey = useCustomRange
      ? `analytics:${storeId}:overview:${start}:${end}` //Key handle both our day/week/month or periods for caching
      : `analytics:${storeId}:overview:${period}`;

    //cache check first, trying to get a cache hit
    const cached = await this.redis.get(cacheKey);
    if (cached) {//return immediatley aftr
      return JSON.parse(cached);
    }

    let whereClause: string;
    let params: (string | undefined)[];

    if (useCustomRange) {
      whereClause = 'store_id = $1 AND timestamp >= $2::timestamptz AND timestamp <= $3::timestamptz';
      params = [storeId, start, end];
    } else {
      const interval = this.getInterval(period || 'month');
      whereClause = 'store_id = $1 AND timestamp >= NOW() - $2::interval';
      params = [storeId, interval];
    }

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
         WHERE ${whereClause}
         GROUP BY event_type
       ) sub`,
      params,
    );

    const liveResult = await this.pool.query(
      `SELECT COUNT(*) AS view_count
       FROM events
       WHERE store_id = $1 AND event_type = 'page_view' AND timestamp >= NOW() - INTERVAL '5 minutes'`,
      [storeId],
    );

    const row = result.rows[0];
    const data = {
      total_revenue: parseFloat(row.total_revenue),
      events_by_type: row.events_by_type,
      conversion_rate: parseFloat(row.conversion_rate),
      estimated_live_visitors: Math.round(parseInt(liveResult.rows[0].view_count) / 3),
      period: useCustomRange ? 'custom' : period,
      store_id: storeId,
      ...(useCustomRange && { start, end }),
    };

    await this.redis.set(cacheKey, JSON.stringify(data), 'EX', 60);
    return data;
  }

  async getTopProducts(storeId: string) {
    const cacheKey = `analytics:${storeId}:top-products`;
    const cached = await this.redis.get(cacheKey);//alsways try to get a cache hit first
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
