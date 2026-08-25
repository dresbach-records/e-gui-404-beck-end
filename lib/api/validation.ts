import { z } from 'zod'

export const pageQuery = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) })
export const contentStatus = z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'])
export const reportStatus = z.enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ESCALATED', 'RESOLVED', 'ARCHIVED'])
export const idParam = z.coerce.number().int().positive()
export const slugParam = z.string().trim().min(1).max(160)
export const contentInput = z.object({ title: z.string().trim().min(3).max(180), summary: z.string().trim().min(3).max(1000), content: z.unknown().default({}), status: contentStatus.default('DRAFT') })
export const articleInput = z.object({ slug: z.string().trim().min(1).max(180), title: z.string().trim().min(3).max(180), summary: z.string().trim().min(3).max(1000), content: z.string().min(1), status: contentStatus.default('DRAFT') })
