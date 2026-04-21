import { Bug } from '../models/bug.model'

/**
 * Generates a human-readable bug ID like "FP-001"
 * Uses MongoDB count to determine the next sequence number.
 */
export async function generateBugId(projectSlug: string): Promise<string> {
  const prefix = projectSlug.replace(/-/g, '').slice(0, 2).toUpperCase()
  const count = await Bug.countDocuments()
  return `${prefix}-${String(count + 1).padStart(3, '0')}`
}

/**
 * Parse pagination params from query string safely.
 */
export function parsePagination(page?: string, limit?: string, max = 100) {
  const p = Math.max(1, parseInt(page || '1', 10))
  const l = Math.min(max, Math.max(1, parseInt(limit || '20', 10)))
  return { page: p, limit: l, skip: (p - 1) * l }
}
