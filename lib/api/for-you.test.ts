import test from 'node:test'
import assert from 'node:assert/strict'
import { decodeFeedCursor, encodeFeedCursor } from './for-you'

test('cursor do For You é round-trip seguro', () => {
  const cursor = { createdAt: '2026-08-26T15:00:00.000Z', id: 42 }
  assert.deepEqual(decodeFeedCursor(encodeFeedCursor(cursor)), cursor)
})

test('cursor inválido é rejeitado', () => {
  assert.equal(decodeFeedCursor('not-a-cursor'), null)
  assert.equal(decodeFeedCursor(Buffer.from(JSON.stringify({ createdAt: 'invalid', id: 1 })).toString('base64url')), null)
})
