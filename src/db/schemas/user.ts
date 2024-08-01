import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { authorization, category } from '../schema';
import { relations } from 'drizzle-orm';

/**
 * There will be four type of role:
 * 'user', 'clerk', 'manager' and 'admin'
 *
 * __user__  = can view, can create, can update own data
 *
 * __clerk__ = can view, can create, can update others data
 *
 * __manager__ = can view, can create, can update, can delete others data
 *
 * __admin__ = all
 *
 */
export const roleEnum = pgEnum('role', ['user', 'clerk', 'manager', 'admin']);

export const user = pgTable('user', {
  userId: uuid('user_id').defaultRandom().primaryKey(),

  firstName: varchar('first_name', { length: 50 }),

  lastName: varchar('last_name', { length: 50 }),

  displayName: varchar('display_name', { length: 10 }).notNull(),

  email: varchar('email', { length: 256 })
    .unique('user_email_unique')
    .notNull(),

  phone: varchar('phone', { length: 15 }),

  password: varchar('password', { length: 256 }).notNull(),

  profilePhotoUrl: varchar('profile_photo_url', { length: 256 }),

  emailVerified: boolean('email_verified').default(false).notNull(),

  phoneVerified: boolean('phone_verified').default(false).notNull(),

  role: roleEnum('user_role').default('user').notNull(),

  /**
   * This will be used to store the verification code for email and phone
   */
  verificationCode: varchar('verification_code', { length: 6 }).unique(
    'user_verification_code_unique',
  ),

  /**
   * This will be used to store the verification token for email verification
   */
  emailVerificationToken: varchar('email_verification_token', { length: 500 }),

  emailVerificationCodeLastSentAt: timestamp(
    'email_verification_code_last_sent_at',
    {
      precision: 6,
      withTimezone: true,
    },
  ),

  emailVerificationCodeSentCount: integer('email_verification_code_sent_count'),

  passwordResetToken: varchar('password_reset_token', { length: 500 }),

  passwordResetCode: varchar('password_reset_code', { length: 20 }).unique(
    'user_password_reset_code_unique',
  ),

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

export const userRelation = relations(user, ({ many }) => ({
  authorization: many(authorization),
  category: many(category),
}));
