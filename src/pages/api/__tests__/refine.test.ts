import { createMocks } from 'node-mocks-http'
import handler from '../refine'
import * as geminiModule from '@/lib/gemini'

jest.mock('@/lib/gemini')

describe('/api/refine', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should refine text successfully', async () => {
    const mockRefineText = jest.spyOn(geminiModule, 'refineText' as any)
    mockRefineText.mockResolvedValue('I went to school yesterday and met my friend.')

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        text: 'I go to school yesterday and meet my friend.',
      },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.refinedText).toBeTruthy()
    expect(typeof data.refinedText).toBe('string')
  })

  it('should return 400 for empty text', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        text: '',
      },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
  })

  it('should return 400 for missing text', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {},
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
  })

  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(405)
  })

  describe('Retry logic', () => {
    it('should retry on failure and succeed on third attempt', async () => {
      const mockRefineText = jest.spyOn(geminiModule, 'refineText' as any)
      mockRefineText
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce('Refined text')

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          text: 'Test text',
        },
      })

      const handlerPromise = handler(req, res)
      await jest.runAllTimersAsync()
      await handlerPromise

      expect(res._getStatusCode()).toBe(200)
      expect(mockRefineText).toHaveBeenCalledTimes(3)
      const data = JSON.parse(res._getData())
      expect(data.refinedText).toBe('Refined text')
    })

    it('should return 500 after 3 failed attempts', async () => {
      const mockRefineText = jest.spyOn(geminiModule, 'refineText' as any)
      mockRefineText.mockRejectedValue(new Error('Persistent failure'))

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          text: 'Test text',
        },
      })

      const handlerPromise = handler(req, res)
      await jest.runAllTimersAsync()
      await handlerPromise

      expect(res._getStatusCode()).toBe(500)
      expect(mockRefineText).toHaveBeenCalledTimes(3)
      const data = JSON.parse(res._getData())
      expect(data.error).toBe('Failed to refine text')
    })

    it('should handle rate limit errors with 429 status', async () => {
      const mockRefineText = jest.spyOn(geminiModule, 'refineText' as any)
      mockRefineText.mockRejectedValue(new Error('429 rate limit exceeded'))

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          text: 'Test text',
        },
      })

      const handlerPromise = handler(req, res)
      await jest.runAllTimersAsync()
      await handlerPromise

      expect(res._getStatusCode()).toBe(429)
      const data = JSON.parse(res._getData())
      expect(data.error).toBe('Rate limit exceeded, please try again later')
    })

    it('should handle rate limit errors with "rate limit" in message', async () => {
      const mockRefineText = jest.spyOn(geminiModule, 'refineText' as any)
      mockRefineText.mockRejectedValue(new Error('API rate limit exceeded'))

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          text: 'Test text',
        },
      })

      const handlerPromise = handler(req, res)
      await jest.runAllTimersAsync()
      await handlerPromise

      expect(res._getStatusCode()).toBe(429)
      const data = JSON.parse(res._getData())
      expect(data.error).toBe('Rate limit exceeded, please try again later')
    })

    it('should delay between retry attempts', async () => {
      const mockRefineText = jest.spyOn(geminiModule, 'refineText' as any)
      mockRefineText
        .mockRejectedValueOnce(new Error('Failure 1'))
        .mockRejectedValueOnce(new Error('Failure 2'))
        .mockResolvedValueOnce('Success')

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          text: 'Test text',
        },
      })

      const handlerPromise = handler(req, res)
      await jest.runAllTimersAsync()
      await handlerPromise

      expect(res._getStatusCode()).toBe(200)
      expect(mockRefineText).toHaveBeenCalledTimes(3)
    })

    it('should not delay after final failed attempt', async () => {
      const mockRefineText = jest.spyOn(geminiModule, 'refineText' as any)
      mockRefineText.mockRejectedValue(new Error('Persistent failure'))

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          text: 'Test text',
        },
      })

      const handlerPromise = handler(req, res)
      await jest.runAllTimersAsync()
      await handlerPromise

      expect(res._getStatusCode()).toBe(500)
      expect(mockRefineText).toHaveBeenCalledTimes(3)
    })
  })
})
