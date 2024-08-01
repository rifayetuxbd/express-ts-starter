import { relations } from 'drizzle-orm';
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { user } from '../schema';

export const authorization = pgTable('authorization', {
  authorizationId: uuid('authorization_id')
    .defaultRandom()
    .notNull()
    .primaryKey(),

  userId: uuid('user_id')
    .references(() => user.userId, {
      onDelete: 'cascade',
    })
    .notNull(),

  /**
   * random generated uuid of length 36
   */
  sessionId: uuid('session_id')
    .defaultRandom()
    .unique('authorization_session_id_unique')
    .notNull(),

  refreshToken: varchar('refresh_token', { length: 500 }).notNull(),

  /**
   * Browser user agent
   */
  userAgent: varchar('user_agent', { length: 256 }).notNull(),

  // TODO: include ip address, location etc.

  lastLoginAt: timestamp('last_login_at', {
    precision: 6,
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

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
    fields: [authorization.userId],
    references: [user.userId],
  }),
}));
