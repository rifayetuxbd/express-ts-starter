import { relations } from 'drizzle-orm';
import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { user } from '../schema';

export const address = pgTable('address', {
  addressId: uuid('address_id').defaultRandom().primaryKey(),

  city: varchar('city', { length: 50 }).notNull(),
  zipCode: varchar('zip_code', { length: 20 }).notNull(),
  country: varchar('country', { length: 50 }).notNull(),
  addressLine1: varchar('address_line1', { length: 256 }).notNull(),
  addressLine2: varchar('address_line2', { length: 256 }),

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

export const addressRelation = relations(address, ({ one }) => ({
  user: one(user, {
    fields: [address.addressId],
    references: [user.addressId],
  }),
}));
