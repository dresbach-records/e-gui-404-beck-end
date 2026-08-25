import { betterAuth } from 'better-auth'
import { pool } from '@/lib/db'

export const auth = betterAuth({
  database: pool,
  basePath: '/api/v1/auth',
  baseURL: process.env.BETTER_AUTH_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.V0_RUNTIME_URL),
  emailAndPassword: { enabled: true, autoSignIn: true },
  trustedOrigins: [
    'https://egui404.fun',
    'https://www.egui404.fun',
    ...(process.env.NODE_ENV === 'development'
      ? ['http://localhost:3000', process.env.V0_RUNTIME_URL, process.env.V0_DEV_APP_URL, process.env.V0_BUILD_URL, process.env.V0_SANDBOX_URL].filter((value): value is string => Boolean(value))
      : [process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_URL].filter((value): value is string => Boolean(value)).map((value) => `https://${value}`)),
  ],
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  ...(process.env.NODE_ENV === 'development'
    ? { advanced: { defaultCookieAttributes: { sameSite: 'none' as const, secure: true } } }
    : {}),
})
