import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const cooperativas = pgTable('cooperativas', {
  id: uuid('id').primaryKey().defaultRandom(),
  nickname: varchar('nickname', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }).unique(),
  name: varchar('name', { length: 255 }).notNull(),
  responsible: varchar('responsible', { length: 255 }),
  status: varchar('status', { length: 20 }).default('Ativo').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const cooperativasRelations = relations(cooperativas, ({ many }) => ({
  // Define relations here if cooperatives relate to other tables like users, members, etc.
}));
