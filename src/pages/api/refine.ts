import type { NextApiRequest, NextApiResponse } from 'next'
import { refineText } from '@/lib/gemini'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function refineWithRetry(text: string): Promise<string> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await refineText(text)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')
      console.error(`Refinement attempt ${attempt} failed:`, lastError.message)

      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS)
      }
    }
  }

  throw lastError || new Error('Refinement failed after retries')
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text } = req.body

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text is required' })
  }

  try {
    const refinedText = await refineWithRetry(text)
    return res.status(200).json({ refinedText })
  } catch (error: unknown) {
    console.error('Error refining text:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      return res.status(429).json({ error: 'Rate limit exceeded, please try again later' })
    }

    return res.status(500).json({ error: 'Failed to refine text' })
  }
}
