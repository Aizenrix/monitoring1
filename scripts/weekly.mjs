import { readData } from './data.mjs'
import { notify } from './telegram.mjs'

export function weeklyReport(sites, history) {
  const runs = history.slice(0, 7)
  const lines = sites.map(site => {
    const results = runs.flatMap(run => run.checks.filter(check => check.id === site.id))
    const failures = results.filter(check => !check.ok).length
    return site.name + ' — ' + (results.length ? failures + ' из ' + results.length : 'проверок пока нет')
  })
  return ['Сводка мониторинга за неделю', 'Сколько раз сайт не открылся за последние семь проверок', ...lines].join('\n')
}

if (import.meta.main) {
  const [sites, { history }] = await Promise.all([readData('sites.json'), readData('results.json')])
  if (history.length === 0) {
    console.log('История пока пуста, сводка не отправлена')
  } else {
    await notify(weeklyReport(sites, history))
  }
}
