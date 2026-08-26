import { bigint, boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(), name: text('name').notNull(), email: text('email').notNull().unique(), emailVerified: boolean('emailVerified').default(false).notNull(), image: text('image'), createdAt: timestamp('createdAt').defaultNow().notNull(), updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})
export const session = pgTable('session', { id: text('id').primaryKey(), expiresAt: timestamp('expiresAt').notNull(), token: text('token').notNull().unique(), createdAt: timestamp('createdAt').defaultNow().notNull(), updatedAt: timestamp('updatedAt').defaultNow().notNull(), ipAddress: text('ipAddress'), userAgent: text('userAgent'), userId: text('userId').notNull() })
export const account = pgTable('account', { id: text('id').primaryKey(), accountId: text('accountId').notNull(), providerId: text('providerId').notNull(), userId: text('userId').notNull(), accessToken: text('accessToken'), refreshToken: text('refreshToken'), idToken: text('idToken'), accessTokenExpiresAt: timestamp('accessTokenExpiresAt'), refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'), scope: text('scope'), password: text('password'), issuer: text('issuer'), createdAt: timestamp('createdAt').defaultNow().notNull(), updatedAt: timestamp('updatedAt').defaultNow().notNull() })
export const verification = pgTable('verification', { id: text('id').primaryKey(), identifier: text('identifier').notNull(), value: text('value').notNull(), expiresAt: timestamp('expiresAt').notNull(), createdAt: timestamp('createdAt').defaultNow().notNull(), updatedAt: timestamp('updatedAt').defaultNow().notNull() })
export const error404Visits = pgTable('error_404_visits', { id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(), path: text('path').notNull(), referrer: text('referrer'), userAgent: text('user_agent'), createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull() })

export const communities = pgTable('communities', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  name: text('name').notNull(), slug: text('slug').notNull().unique(), description: text('description'), avatar: text('avatar'), banner: text('banner'), category: text('category'), visibility: text('visibility').default('PUBLIC').notNull(), language: text('language').default('pt-BR').notNull(), ownerId: text('owner_id').notNull(), status: text('status').default('ACTIVE').notNull(), createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(), updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const communityMembers = pgTable('community_members', {
  communityId: bigint('community_id', { mode: 'number' }).notNull(), userId: text('user_id').notNull(), role: text('role').default('MEMBER').notNull(), status: text('status').default('ACTIVE').notNull(), joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
})

export const communityRules = pgTable('community_rules', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(), communityId: bigint('community_id', { mode: 'number' }).notNull(), position: bigint('position', { mode: 'number' }).notNull(), title: text('title').notNull(), description: text('description').notNull(), createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(), updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
