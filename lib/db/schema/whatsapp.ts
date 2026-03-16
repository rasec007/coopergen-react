import {
  pgTable,
  varchar,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';

export const whatsappSessions = pgTable('whatsapp_sessions', {
  phoneNumber: varchar('phone_number', { length: 20 }).primaryKey(),
  step: varchar('step', { length: 50 }).default('START').notNull(),
  data: jsonb('data').default({}).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
