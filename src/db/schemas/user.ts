import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { address, authorization } from '../schema';
import { relations } from 'drizzle-orm';

export const user = pgTable('user', {
  userId: uuid('user_id').defaultRandom().primaryKey(),

  firstName: varchar('first_name', { length: 50 }),

  lastName: varchar('last_name', { length: 50 }),

  displayName: varchar('display_name', { length: 50 }),

  email: varchar('email', { length: 256 }).unique().notNull(),

  phone: varchar('phone', { length: 15 }),

  password: varchar('password', { length: 256 }).notNull(),

  profilePhotoUrl: varchar('profile_photo_url', { length: 256 }),

  addressId: uuid('address_id')
    .notNull()
    .references(() => address.addressId),

  authorizationId: uuid('authorization_id').references(
    () => authorization.authorizationId,
    { onDelete: 'cascade' },
  ),

  createdAt: timestamp('created_at', {
    precision: 6,
    withTimezone: true,
  }).defaultNow(),

  updatedAt: timestamp('updated_at', {
    precision: 6,
    withTimezone: true,
  }).defaultNow(),
});

export const userRelation = relations(user, ({ many, one }) => ({
  authorization: many(authorization),
  address: one(address, {
    fields: [user.addressId],
    references: [address.addressId],
  }),
}));
