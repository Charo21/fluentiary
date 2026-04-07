import { refineText } from '../gemini'

describe('refineText', () => {
  it('should refine English text', async () => {
    const input = 'I go to school yesterday and meet my friend.'
    const result = await refineText(input)

    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
    expect(result).not.toBe(input) // Should be different from input
  })

  it('should handle empty input', async () => {
    await expect(refineText('')).rejects.toThrow()
  })
})
