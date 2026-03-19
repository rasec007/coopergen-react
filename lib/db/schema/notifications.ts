import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';
import { cooperados } from './cooperados';

export const notificationQueue = pgTable('notification_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  cooperadoId: uuid('cooperado_id').references(() => cooperados.id),
  type: varchar('type', { length: 20 }).notNull(), // 'email', 'whatsapp'
  status: varchar('status', { length: 20 }).default('pending').notNull(), // 'pending', 'sent', 'failed'
  recipient: varchar('recipient', { length: 255 }).notNull(), // E-mail ou número de telefone
  payload: jsonb('payload').notNull(), // Conteúdo da mensagem { subject, body, itemType }
  attempts: integer('attempts').default(0).notNull(),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
});
