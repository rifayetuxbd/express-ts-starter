import { relations } from 'drizzle-orm';
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { user } from '../schema';

export const authorization = pgTable('authorization', {
  authorizationId: uuid('authorization_id')
    .defaultRandom()
    .notNull()
    .primaryKey(),

  deviceId: varchar('device_id', { length: 256 }).unique().notNull(),

  refreshToken: varchar('refresh_token', { length: 256 }).notNull(),

  expiresIn: timestamp('expires_in', {
    precision: 6,
    withTimezone: true,
  }).notNull(),

  createdAt: timestamp('created_at', {
    precision: 6,
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp('updated_at', {
    precision: 6,
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const authorizationRelation = relations(authorization, ({ one }) => ({
  user: one(user, {
    fields: [authorization.authorizationId],
    references: [user.authorizationId],
  }),
}));
