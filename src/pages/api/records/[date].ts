import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import type { DailyRecord, RecordUpdateInput } from '@/types/record'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { date } = req.query

  if (typeof date !== 'string') {
    return res.status(400).json({ error: 'Invalid date parameter' })
  }

  if (req.method === 'GET') {
    try {
      const record = await prisma.record.findUnique({
        where: { date: new Date(date) },
      })

      if (!record) {
        return res.status(200).json({ record: null })
      }

      const response: DailyRecord = {
        id: record.id,
        date: record.date.toISOString().split('T')[0],
        keyPoints: record.keyPoints,
        freeWrite: record.freeWrite,
        refinedText: record.refinedText,
        isComplete: record.isComplete,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      }

      return res.status(200).json({ record: response })
    } catch (error: unknown) {
      console.error('Error fetching record:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (req.method === 'PUT') {
    try {
      const body = req.body as RecordUpdateInput

      const record = await prisma.record.upsert({
        where: { date: new Date(date) },
        update: {
          keyPoints: body.keyPoints,
          freeWrite: body.freeWrite,
          refinedText: body.refinedText,
          isComplete: body.refinedText ? true : undefined,
        },
        create: {
          date: new Date(date),
          keyPoints: body.keyPoints || '',
          freeWrite: body.freeWrite || '',
          refinedText: body.refinedText || null,
          isComplete: body.refinedText ? true : false,
        },
      })

      const response: DailyRecord = {
        id: record.id,
        date: record.date.toISOString().split('T')[0],
        keyPoints: record.keyPoints,
        freeWrite: record.freeWrite,
        refinedText: record.refinedText,
        isComplete: record.isComplete,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      }

      return res.status(200).json({ record: response })
    } catch (error: unknown) {
      console.error('Error updating record:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
