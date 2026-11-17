import { getAccount } from '@/features/auth/server/session'
import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import type { Record as StoredRecord } from '@prisma/client'
import type { DailyRecord, RecordUpdateInput } from '@/features/records/types'

function isValidDate(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false
  const date = new Date(dateString)
  return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === dateString
}

function transformRecord(record: StoredRecord): DailyRecord {
  return {
    id: record.id,
    date: record.date.toISOString().split('T')[0],
    keyPoints: record.keyPoints,
    freeWrite: record.freeWrite,
    refinedText: record.refinedText,
    isComplete: record.isComplete,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function validateUpdateInput(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be an object' }
  }

  if (body.keyPoints !== undefined && typeof body.keyPoints !== 'string') {
    return { valid: false, error: 'keyPoints must be a string' }
  }

  if (body.freeWrite !== undefined && typeof body.freeWrite !== 'string') {
    return { valid: false, error: 'freeWrite must be a string' }
  }

  if (body.refinedText !== undefined && body.refinedText !== null && typeof body.refinedText !== 'string') {
    return { valid: false, error: 'refinedText must be a string or null' }
  }

  return { valid: true }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const account = await getAccount(req, res)
  if (!account) return res.status(401).json({ error: 'Unauthorized' })

  const { date } = req.query

  if (typeof date !== 'string') {
    return res.status(400).json({ error: 'Invalid date parameter' })
  }

  if (!isValidDate(date)) {
    return res.status(400).json({ error: 'Invalid date format' })
  }

  if (req.method === 'GET') {
    try {
      const record = await prisma.record.findUnique({
        where: { userId_date: { userId: account.id, date: new Date(date) } },
      })

      if (!record) {
        return res.status(200).json({ record: null })
      }

      return res.status(200).json({ record: transformRecord(record) })
    } catch (error: unknown) {
      console.error('Error fetching record:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'PUT') {
    try {
      const validation = validateUpdateInput(req.body)
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error })
      }

      const body = req.body as RecordUpdateInput

      const record = await prisma.record.upsert({
        where: { userId_date: { userId: account.id, date: new Date(date) } },
        update: {
          keyPoints: body.keyPoints,
          freeWrite: body.freeWrite,
          refinedText: body.refinedText,
          isComplete: !!body.refinedText,
        },
        create: {
          userId: account.id,
          date: new Date(date),
          keyPoints: body.keyPoints || '',
          freeWrite: body.freeWrite || '',
          refinedText: body.refinedText || null,
          isComplete: !!body.refinedText,
        },
      })

      return res.status(200).json({ record: transformRecord(record) })
    } catch (error: unknown) {
      console.error('Error updating record:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
