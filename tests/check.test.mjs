import assert from 'node:assert/strict'
import test from 'node:test'
import { appendRun, checkSite, statusChanges } from '../scripts/check.mjs'
import { readData } from '../scripts/data.mjs'
import { notify } from '../scripts/telegram.mjs'
import { weeklyReport } from '../scripts/weekly.mjs'

const site = { id: 'alpha', name: 'Альфа', url: 'https://alpha.github.io/' }
const good = { id: site.id, ok: true, status: 200 }
const bad = { id: site.id, ok: false, status: 404 }

test('список содержит минимум пять уникальных латинских id и HTTPS-адресов', async () => {
  const sites = await readData('sites.json')
  assert.ok(sites.length >= 5)
  assert.equal(new Set(sites.map(site => site.id)).size, sites.length)
  for (const site of sites) {
    assert.match(site.id, /^[a-z][a-z0-9-]*$/)
    assert.equal(new URL(site.url).protocol, 'https:')
  }
})

test('успешный HTML сохраняет код, время ответа и заголовок', async () => {
  const response = new Response('<title>Страница &amp; \n Пример &#33;</title>', {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
  const result = await checkSite(site, async () => response)
  assert.equal(result.ok, true)
  assert.equal(result.status, 200)
  assert.ok(result.ms >= 0)
  assert.equal(result.title, 'Страница & Пример !')
})

test('успешный ответ без HTML оставляет заголовок пустым', async () => {
  const result = await checkSite(site, async () => new Response('ok'))
  assert.equal(result.ok, true)
  assert.equal(result.title, undefined)
})

test('HTTP 404 записывается как сбой', async () => {
  const result = await checkSite(site, async () => new Response(null, { status: 404 }))
  assert.equal(result.ok, false)
  assert.equal(result.status, 404)
})

test('таймаут и сетевой сбой записываются без HTTP-кода', async () => {
  const timeout = await checkSite(site, async () => { throw new DOMException('', 'TimeoutError') })
  const network = await checkSite(site, async () => { throw new TypeError('fetch failed') })
  assert.equal(timeout.status, 0)
  assert.equal(timeout.error, 'Таймаут 15 с')
  assert.equal(network.error, 'Сетевая ошибка')
})

test('новый сбой и повторение одного сбоя', () => {
  assert.match(statusChanges([site], [bad])[0], /Не открывается: Альфа · 404/)
  assert.match(statusChanges([site], [bad], { checks: [good] })[0], /Не открывается/)
  assert.deepEqual(statusChanges([site], [bad], { checks: [bad] }), [])
})

test('восстановление, успешный первый запуск и удалённый сайт', () => {
  assert.match(statusChanges([site], [good], { checks: [bad] })[0], /Снова работает: Альфа/)
  assert.deepEqual(statusChanges([site], [good]), [])
  assert.deepEqual(statusChanges([], [], { checks: [bad] }), [])
})

test('новая проверка первая, история ограничена 30 записями', () => {
  const history = Array.from({ length: 30 }, (_, index) => ({ time: String(index) }))
  const result = appendRun(history, { time: 'новая' })
  assert.equal(result.length, 30)
  assert.equal(result[0].time, 'новая')
  assert.equal(result[29].time, '28')
})

test('сводка считает только семь последних проверок и только известные результаты', () => {
  const history = Array.from({ length: 8 }, () => ({ checks: [bad] }))
  const text = weeklyReport([site, { id: 'missing', name: 'Бета' }], history)
  assert.match(text, /Альфа — 7 из 7/)
  assert.match(text, /Бета — проверок пока нет/)
})

test('Telegram получает ожидаемый JSON, а ошибки не раскрывают токен', async () => {
  const env = { TELEGRAM_TOKEN: 'fake-token', TELEGRAM_CHAT_ID: '42' }
  await notify('Сообщение', env, async (url, options) => {
    assert.match(url, /\/botfake-token\/sendMessage$/)
    assert.equal(options.method, 'POST')
    assert.equal(JSON.parse(options.body).chat_id, '42')
    assert.equal(JSON.parse(options.body).text, 'Сообщение')
    return Response.json({ ok: true })
  })
  await assert.rejects(notify('Сообщение', env, async () => {
    throw new Error('fake-token')
  }), { message: 'Telegram недоступен или превысил время ожидания' })
  await assert.rejects(notify('Сообщение', env, async () => new Response(null, { status: 401 })), /HTTP 401/)
})

test('в Actions отсутствие секретов завершает работу ошибкой', async () => {
  await assert.rejects(notify('Сообщение', { GITHUB_ACTIONS: 'true' }), /Задайте оба секрета/)
})
