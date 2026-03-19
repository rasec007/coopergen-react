import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  text,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { cooperativas } from './cooperativas';
import { postosTrabalho } from './postos_trabalho';
import { users } from './users';

export const cooperados = pgTable('cooperados', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  phone: varchar('phone', { length: 20 }),
  cpf: varchar('cpf', { length: 14 }).unique(),
  apelido: varchar('apelido', { length: 100 }),
  matricula: varchar('matricula', { length: 20 }).unique(),
  cooperativaId: uuid('cooperativa_id')
    .references(() => cooperativas.id),
  postoTrabalhoId: uuid('posto_trabalho_id')
    .references(() => postosTrabalho.id),
  userId: uuid('user_id')
    .references(() => users.id), // Permite vincular a uma conta de login
  perfil: varchar('perfil', { length: 50 }).default('Cooperado'),
  status: varchar('status', { length: 20 }).default('Ativo').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  profileConfirmed: boolean('profile_confirmed').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const cooperadosRelations = relations(cooperados, ({ one }) => ({
  cooperativa: one(cooperativas, {
    fields: [cooperados.cooperativaId],
    references: [cooperativas.id],
  }),
  postoTrabalho: one(postosTrabalho, {
    fields: [cooperados.postoTrabalhoId],
    references: [postosTrabalho.id],
  }),
  user: one(users, {
    fields: [cooperados.userId],
    references: [users.id],
  }),
}));
