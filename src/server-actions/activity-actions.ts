'use server'

import { getPayload } from 'payload'
import config from '@payload-config'

export interface ActivityLog {
  id: number
  type: string
  title: string
  description?: string | null
  createdAt: string
  actor?: Record<string, unknown> | number | null
  task?: Record<string, unknown> | number | null
  client?: Record<string, unknown> | number | null
  tutor?: Record<string, unknown> | number | null
  metadata?: Record<string, unknown> | null
}

export async function fetchActivityLogs(
  params: {
    search?: string
    types?: string[]
    from?: string
    to?: string
    limit?: number
  } = {},
): Promise<ActivityLog[]> {
  const payload = await getPayload({ config })
  // Using a loose type for dynamic where construction compatible with Payload 'Where'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (params.search) {
    where.or = [{ title: { like: params.search } }, { description: { like: params.search } }]
  }
  if (params.types && params.types.length) {
    where.type = { in: params.types }
  }
  if (params.from && params.to) {
    if (!where.and) where.and = []
    where.and.push({ createdAt: { greater_than_equal: params.from } })
    where.and.push({ createdAt: { less_than_equal: params.to } })
  }
  const res = await payload.find({
    collection: 'activity-logs',
    where,
    sort: '-createdAt',
    limit: params.limit || 200,
    depth: 1,
  })
  return res.docs as ActivityLog[]
}
