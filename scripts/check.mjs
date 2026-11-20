import { readData, writeData } from './data.mjs'
import { notify } from './telegram.mjs'

const maxHistory = 30
const maxTitleBytes = 64 * 1024
const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

function cleanTitle(text) {
  return text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
    if (!code.startsWith('#')) return entities[code.toLowerCase()] ?? entity
    const number = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1))
    return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : entity
  }).replace(/\s+/g, ' ').trim().slice(0, 240)
}

async function readTitle(response) {
  const reader = response.body?.getReader()
  if (!reader) return ''
  const decoder = new TextDecoder()
  let remaining = maxTitleBytes
  let html = ''
  try {
    while (remaining > 0) {
      const { done, value } = await reader.read()
      if (done) break
      html += decoder.decode(value.subarray(0, remaining), { stream: true })
      remaining -= value.length
      const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)
      if (title) return cleanTitle(title[1])
      if (/<\/head\s*>/i.test(html)) break
    }
    return ''
  } finally {
    await reader.cancel().catch(() => {})
  }
}

export async function checkSite(site, request = fetch) {
  const start = performance.now()
  const elapsed = () => Math.round(performance.now() - start)
  let response
  try {
    response = await request(site.url, { signal: AbortSignal.timeout(15_000) })
  } catch (error) {
    const message = error.name === 'TimeoutError' ? 'Таймаут 15 с' : 'Сетевая ошибка'
    return { id: site.id, ok: false, status: 0, ms: elapsed(), error: message }
  }
  const check = { id: site.id, ok: response.ok, status: response.status, ms: elapsed(), error: '' }
  if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
    const title = await readTitle(response).catch(() => '')
    if (title) check.title = title
  } else {
    await response.body?.cancel().catch(() => {})
  }
  return check
}

export function statusChanges(sites, checks, previous) {
  const oldChecks = new Map(previous?.checks.map(check => [check.id, check]))
  const current = new Map(checks.map(check => [check.id, check]))
  return sites.flatMap(site => {
    const check = current.get(site.id)
    if (!check) return []
    const before = oldChecks.get(site.id)
    if (!check.ok && (!before || before.ok)) {
      return ['🔴 Не открывается: ' + site.name + ' · ' + (check.status || check.error) + '\n' + site.url]
    }
    if (check.ok && before?.ok === false) return ['🟢 Снова работает: ' + site.name + '\n' + site.url]
    return []
  })
}

export function appendRun(history, run) {
  return [run, ...history].slice(0, maxHistory)
}

async function main() {
  const [sites, { history }] = await Promise.all([readData('sites.json'), readData('results.json')])
  const checks = await Promise.all(sites.map(site => checkSite(site)))
  for (const [index, check] of checks.entries()) {
    console.log((check.ok ? 'OK' : 'FAIL') + ' ' + (check.status || check.error) + ' ' + check.ms + ' мс ' + sites[index].url)
  }
  const changes = statusChanges(sites, checks, history[0])
  if (changes.length) {
    await notify('Ночная проверка сайтов\n\n' + changes.join('\n\n'))
  } else {
    console.log('Изменений нет, сообщение не отправлено')
  }
  await writeData('results.json', { history: appendRun(history, { time: new Date().toISOString(), checks }) })
}

if (import.meta.main) await main()
