import { AnyColumn, sql } from 'drizzle-orm';

export const increment = (column: AnyColumn, value = 1) => {
  return sql`CASE WHEN COALESCE(${column}, 0) = 0 THEN ${value} ELSE COALESCE(${column}, 0) + ${value} END`;
};
