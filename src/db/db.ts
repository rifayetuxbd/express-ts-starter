import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { config } from 'dotenv';
config({ path: '.env' });

const pool = new Pool({
  //   connectionString: "postgres://user:password@host:port/db",
  connectionString: process.env.DATABASE_URL!,
});

// or
// const pool = new Pool({
//   host: '127.0.0.1',
//   port: 5432,
//   user: 'postgres',
//   password: 'password',
//   database: 'ng-pcict',
// });

export const db = drizzle(pool, {
  schema,
});
