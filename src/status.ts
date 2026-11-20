import type { Check, Run } from './monitoring'

export function statusText(check?: Check) {
  if (!check) return 'Ожидает проверки'
  const explanation = check.status || check.error
  const status = check.ok ? 'Открывается' : 'Не открывается'
  return explanation ? status + ' · ' + explanation : status
}

export function statusTone(check?: Check) {
  if (!check) return 'pending'
  return check.ok ? 'up' : 'down'
}

export function siteHistory(history: Run[], id: string) {
  return history.flatMap(({ time, checks }) => {
    const check = checks.find(check => check.id === id)
    return check ? [{ time, check }] : []
  })
}

const formatter = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Europe/Moscow', day: 'numeric', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
})

export function formatTime(time: string) {
  return formatter.format(new Date(time))
}
