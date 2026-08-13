import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

/**
 * Keeps the Supabase project awake.
 *
 * The free tier pauses a project after a week without requests, so this route
 * is hit once a day by the Vercel cron job declared in vercel.json. It has to
 * touch the database for real — a static response would not count as activity.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Vercel sends `Authorization: Bearer <CRON_SECRET>` whenever CRON_SECRET is
  // configured on the project. Without the secret the route stays open so it
  // still works right after deploying.
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const records = await prisma.record.count()
    return res.status(200).json({
      ok: true,
      records,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Keepalive query failed:', error)
    return res.status(500).json({ ok: false, error: 'Database unreachable' })
  }
}
