import { createMocks } from 'node-mocks-http'
import handler from '../refine'

describe('/api/refine', () => {
  it('should refine text successfully', async () => {
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
  }, 30000) // 30 second timeout for API call

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
})
