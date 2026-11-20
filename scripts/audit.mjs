import lighthouse from 'lighthouse'
import { launch } from 'chrome-launcher'
import { chromium } from 'playwright'
import { readData, writeData } from './data.mjs'

const [sites, { history }] = await Promise.all([readData('sites.json'), readData('results.json')])
const scores = {}
const chrome = await launch({ chromePath: chromium.executablePath(), chromeFlags: ['--headless', '--disable-dev-shm-usage'] })
try {
  for (const site of sites) {
    if (history[0]?.checks.find(check => check.id === site.id)?.ok !== true) continue
    try {
      const result = await lighthouse(site.url, {
        port: chrome.port, logLevel: 'error', onlyCategories: ['performance', 'accessibility'],
      }, { extends: 'lighthouse:default', settings: { maxWaitForLoad: 25_000 } })
      const performance = result?.lhr.categories.performance?.score
      const accessibility = result?.lhr.categories.accessibility?.score
      if (typeof performance !== 'number' || typeof accessibility !== 'number') {
        console.log('Нет полной оценки Lighthouse: ' + site.id)
        continue
      }
      scores[site.id] = { performance: Math.round(performance * 100), accessibility: Math.round(accessibility * 100) }
      console.log(site.id, scores[site.id])
    } catch (error) {
      console.error('Ошибка Lighthouse для ' + site.id + ': ' + error.message)
    }
  }
} finally {
  await chrome.kill()
}
if (Object.keys(scores).length === 0) throw new Error('Lighthouse не получил ни одной оценки')
await writeData('audits.json', { time: new Date().toISOString(), scores })
