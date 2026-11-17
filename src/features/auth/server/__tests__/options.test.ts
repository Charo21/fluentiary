import { authOptions } from '../options'
jest.mock('../adapter', () => ({ createAuthAdapter: () => ({}) }))
const callbacks = authOptions.callbacks!

test('keeps internal user ID and removes the avatar from the JWT and session', async () => {
  const jwt = callbacks.jwt as Function
  const token = await jwt({ token: { sub: 'google-sub', picture: 'discard' }, user: { id: 'internal-user', email: 'a@example.com', name: 'Alice' } })
  expect(token).toEqual({ sub: 'internal-user', email: 'a@example.com', name: 'Alice' })
  const session = await (callbacks.session as Function)({ session: { expires: '2026-12-01T00:00:00Z' }, token })
  expect(session.user).toEqual({ id: 'internal-user', email: 'a@example.com', name: 'Alice' })
})
test('does not trust a client-side session update to change identity', async () => {
  const token = await (callbacks.jwt as Function)({ token: { sub: 'alice', email: 'a@example.com' }, trigger: 'update', session: { user: { id: 'victim' } } })
  expect(token.sub).toBe('alice')
})
test('accepts Google auto-registration without requiring an email verification step', async () => {
  expect(await (callbacks.signIn as Function)({ account: { provider: 'google', providerAccountId: 'google-sub' }, user: { email: 'a@example.com' } })).toBe(true)
  expect(await (callbacks.signIn as Function)({ account: { provider: 'google', providerAccountId: 'google-sub' }, user: { email: '' } })).toBe(false)
})
test.each([
  ['https://evil.example/record/2026-11-09', 'https://app.example'],
  ['/record/2026-11-09', 'https://app.example/record/2026-11-09'],
  ['https://app.example/record/2026-11-09', 'https://app.example/record/2026-11-09'],
  ['//evil.example', 'https://app.example'],
])('redirects %s safely', async (url, expected) => {
  expect(await (callbacks.redirect as Function)({ url, baseUrl: 'https://app.example' })).toBe(expected)
})

test('accepts AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET and AUTH_SECRET environment names', () => {
  const names = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'NEXTAUTH_SECRET', 'AUTH_GOOGLE_ID', 'AUTH_GOOGLE_SECRET', 'AUTH_SECRET']
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]))
  try {
    delete process.env.GOOGLE_CLIENT_ID
    delete process.env.GOOGLE_CLIENT_SECRET
    delete process.env.NEXTAUTH_SECRET
    process.env.AUTH_GOOGLE_ID = 'unit-google-id'
    process.env.AUTH_GOOGLE_SECRET = 'unit-google-secret'
    process.env.AUTH_SECRET = 'unit-auth-secret'
    jest.isolateModules(() => {
      const { authOptions: options } = require('../options')
      expect(options.secret).toBe('unit-auth-secret')
      expect(options.providers[0]).toHaveProperty('options.clientId', 'unit-google-id')
      expect(options.providers[0]).toHaveProperty('options.clientSecret', 'unit-google-secret')
    })
  } finally {
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name]
      else process.env[name] = previous[name]
    }
  }
})
