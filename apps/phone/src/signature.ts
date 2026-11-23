import { createHmac, timingSafeEqual } from 'node:crypto'

/** Twilio request validation: HMAC-SHA1 over the full URL plus sorted POST params. */
export function validTwilioSignature (authToken: string, url: string, params: Record<string, string>, signature?: string): boolean {
  if (!signature) return false
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join('')
  const expected = Buffer.from(createHmac('sha1', authToken).update(data).digest('base64'))
  const given = Buffer.from(signature)
  return expected.length === given.length && timingSafeEqual(expected, given)
}
