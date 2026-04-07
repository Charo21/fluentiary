import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const records = await prisma.record.findMany({
      select: { date: true },
      orderBy: { date: 'desc' },
    })

    const dates = records.map((record) => {
      return record.date.toISOString().split('T')[0]
    })

    return res.status(200).json({ dates })
  } catch (error: unknown) {
    console.error('Error fetching record dates:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
