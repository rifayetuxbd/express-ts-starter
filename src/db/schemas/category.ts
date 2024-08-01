import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { user } from '../schema';
import { relations } from 'drizzle-orm';

export const category = pgTable('category', {
  categoryId: uuid('category_id').defaultRandom().primaryKey(),

  categoryName: varchar('category_name', { length: 50 })
    .unique('category_category_name_unique')
    .notNull(),

  categoryDetails: varchar('category_details', { length: 256 }),

  createdBy: uuid('created_by')
    .references(() => user.userId, {
      onDelete: 'no action',
    })
    .notNull(),

  updatedBy: uuid('updated_by'),

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

export const categoryRelation = relations(category, ({ one }) => ({
  user: one(user, {
    fields: [category.createdBy],
    references: [user.userId],
  }),
}));
