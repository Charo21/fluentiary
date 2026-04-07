import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function refineText(text: string): Promise<string> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty')
  }

  const model = genAI.getGenerativeModel({
    model: process.env.LLM_MODEL || 'gemini-2.5-flash',
    generationConfig: {
      maxOutputTokens: parseInt(process.env.LLM_MAX_TOKENS || '1024', 10),
    },
  })

  const prompt = `You are an expert English writing coach. Your task is to refine the user's English text to sound more natural and native.

Rules:
- Preserve the original meaning and voice
- Correct grammar, vocabulary, and phrasing
- Improve logical flow and coherence
- Make it sound like a native English speaker wrote it
- Do NOT add new ideas or change the topic
- Return ONLY the refined text, no explanations or commentary

Text to refine:
${text}`

  const result = await model.generateContent(prompt)
  const response = result.response
  const refinedText = response.text()

  return refinedText.trim()
}
