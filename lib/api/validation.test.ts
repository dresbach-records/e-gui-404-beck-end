import test from 'node:test'
import assert from 'node:assert/strict'
import { articleInput, contentInput, pageQuery } from './validation'

test('paginação limita páginas e quantidade', () => {
  assert.deepEqual(pageQuery.parse({ page: '2', limit: '100' }), { page: 2, limit: 100 })
  assert.throws(() => pageQuery.parse({ page: '0' }))
})

test('conteúdo exige campos mínimos', () => {
  assert.equal(contentInput.safeParse({ title: 'x' }).success, false)
  assert.equal(articleInput.safeParse({ slug: 'a', title: 'Título válido', summary: 'Resumo válido', content: 'Texto' }).success, true)
})
