import { bigint, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const error404Visits = pgTable('error_404_visits', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  path: text('path').notNull(),
  referrer: text('referrer'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export type Error404Visit = typeof error404Visits.$inferSelect
