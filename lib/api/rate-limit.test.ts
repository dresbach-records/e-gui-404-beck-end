import test from 'node:test'
import assert from 'node:assert/strict'
import { rateLimit } from './rate-limit'

test('rate limit bloqueia após o limite', () => {
  const key = `test-${Date.now()}`
  assert.equal(rateLimit(key, 2, 60_000).allowed, true)
  assert.equal(rateLimit(key, 2, 60_000).allowed, true)
  assert.equal(rateLimit(key, 2, 60_000).allowed, false)
})
