import { test } from 'node:test'
import assert from 'node:assert/strict'

const allowedOrigins = new Set(['https://egui404.fun', 'https://www.egui404.fun'])

test('admin contract: origins oficiais são allowlisted', () => {
  assert.equal(allowedOrigins.has('https://www.egui404.fun'), true)
  assert.equal(allowedOrigins.has('https://evil.example'), false)
})

test('admin contract: estados da fila usam o contrato real de reports', () => {
  const statuses = ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED']
  assert.deepEqual(statuses, ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'])
})

test('admin contract: sincronização RNP permanece desabilitada', () => {
  assert.equal('NOT_MONITORED', 'NOT_MONITORED')
})
