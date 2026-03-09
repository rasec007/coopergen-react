import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { cooperativas } from './cooperativas';

export const postosTrabalho = pgTable('postos_trabalho', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  cooperativaId: uuid('cooperativa_id')
    .notNull()
    .references(() => cooperativas.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  unq: unique().on(table.name, table.cooperativaId),
}));

export const postosTrabalhoRelations = relations(postosTrabalho, ({ one }) => ({
  cooperativa: one(cooperativas, {
    fields: [postosTrabalho.cooperativaId],
    references: [cooperativas.id],
  }),
}));
