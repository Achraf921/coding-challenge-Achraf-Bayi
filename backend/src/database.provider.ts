import { Pool } from 'pg';

export const DATABASE_POOL = 'DATABASE_POOL';

export const databaseProvider = {
  provide: DATABASE_POOL,
  useFactory: () => {
    return new Pool({
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'analytics',
    });
  },
};
