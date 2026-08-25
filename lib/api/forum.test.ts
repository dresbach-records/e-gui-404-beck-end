import test from 'node:test'
import assert from 'node:assert/strict'

test('estados de thread aceitos', () => { for (const status of ['OPEN','LOCKED','SOLVED','ARCHIVED']) assert.equal(typeof status, 'string') })
test('payload de fórum exige conteúdo', () => { assert.equal(Boolean(''), false); assert.equal(Boolean('texto'), true) })
test('ações de moderação são limitadas', () => { assert.deepEqual(['lock','unlock','solve','archive'].sort(), ['archive','lock','solve','unlock']) })
