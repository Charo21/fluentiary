import { safeCallbackUrl } from '../redirect'

test.each([
  ['/record/2026-11-09', '/record/2026-11-09'],
  ['/record/2026-11-09?mode=view', '/record/2026-11-09?mode=view'],
  [undefined, '/'], ['https://evil.example', '/'], ['//evil.example', '/'],
  ['/\\evil.example', '/'], ['/login', '/'], ['/api/auth/signin', '/'],
  ['/%2f%2fevil.example', '/'],
])('keeps callback %s on a safe application page', (value, expected) => {
  expect(safeCallbackUrl(value)).toBe(expected)
})
