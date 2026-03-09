import {
  pgTable,
  uuid,
  integer,
  text,
  timestamp,
  numeric,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { cooperados } from './cooperados';
import { postosTrabalho } from './postos_trabalho';

export const paystubs = pgTable('paystubs', {
  id: uuid('id').primaryKey().defaultRandom(),
  cooperadoId: uuid('cooperado_id')
    .notNull()
    .references(() => cooperados.id, { onDelete: 'cascade' }),
  postoTrabalhoId: uuid('posto_trabalho_id')
    .references(() => postosTrabalho.id),
  type: varchar('type', { length: 50 }).default('Contra Cheque'), // Contra Cheque, Rendimento, Rateio
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  valorBruto: numeric('valor_bruto', { precision: 12, scale: 2 }),
  valorLiquido: numeric('valor_liquido', { precision: 12, scale: 2 }),
  fileUrl: text('file_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const paystubsRelations = relations(paystubs, ({ one }) => ({
  cooperado: one(cooperados, {
    fields: [paystubs.cooperadoId],
    references: [cooperados.id],
  }),
  postoTrabalho: one(postosTrabalho, {
    fields: [paystubs.postoTrabalhoId],
    references: [postosTrabalho.id],
  }),
}));
