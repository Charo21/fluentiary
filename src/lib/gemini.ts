import { GoogleGenerativeAI } from '@google/generative-ai'

function validateApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error(
      'GEMINI_API_KEY environment variable is not set. Please configure it in your .env file.'
    )
  }
  return apiKey
}

let genAI: GoogleGenerativeAI | null = null

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = validateApiKey()
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
}

export async function refineText(text: string): Promise<string> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty')
  }

  try {
    const genAIInstance = getGenAI()
    const model = genAIInstance.getGenerativeModel({
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
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('GEMINI_API_KEY')) {
        throw error
      }
      if (error.message.includes('API key')) {
        throw new Error(`Gemini API key validation failed: ${error.message}`)
      }
      if (error.message.includes('429')) {
        throw new Error('Gemini API rate limit exceeded. Please try again later.')
      }
      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error('Gemini API authentication failed. Please check your API key.')
      }
      throw new Error(`Gemini API error: ${error.message}`)
    }
    throw new Error('An unexpected error occurred while refining text')
  }
}
