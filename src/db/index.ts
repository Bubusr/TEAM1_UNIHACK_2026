import dotenv from 'dotenv';
dotenv.config();
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, type PoolConfig } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export function buildPoolConfig(): PoolConfig {
  // Primary when explicitly provided: standalone PostgreSQL DATABASE_URL
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (dbUrl && dbUrl !== 'MY_DATABASE_URL') {
    const parsed = new URL(dbUrl);
    const socketHost = parsed.searchParams.get('host')?.trim();
    return {
      host: parsed.hostname || socketHost || undefined,
      port: parsed.port ? Number(parsed.port) : 5432,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, ''),
      max: 10,
      connectionTimeoutMillis: 15000,
    };
  }

  // Cloud SQL runtime variables (SQL_HOST, SQL_USER, SQL_PASSWORD, SQL_DB_NAME)
  return {
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER || process.env.SQL_ADMIN_USER,
    password: process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD,
    database: process.env.SQL_DB_NAME,
    max: 10,
    connectionTimeoutMillis: 15000,
  };
}

export const createPool = (): Pool => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool(buildPoolConfig());

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
