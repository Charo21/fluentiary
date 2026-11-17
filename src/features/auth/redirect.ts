/** Allow only application destinations, never provider or login endpoints. */
export function safeCallbackUrl(value: unknown): string {
  if (typeof value !== 'string' || /[\\\x00-\x20]/.test(value)) return '/'
  if (!/^\/(?:record\/\d{4}-\d{2}-\d{2})?(?:\?[^#]*)?$/.test(value)) return '/'
  try {
    const decoded = decodeURIComponent(value)
    if (/[\\\x00-\x20]/.test(decoded) || decoded.startsWith('//')) return '/'
  } catch {
    return '/'
  }
  return value
}
