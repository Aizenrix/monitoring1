import { useEffect, useState, type ReactNode } from 'react'
import { MonitoringContext, type Audit, type MonitoringState, type Run, type Site } from './monitoring'

async function loadJson<T>(file: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(import.meta.env.BASE_URL + 'data/' + file, { signal, cache: 'no-cache' })
  if (!response.ok) throw new Error(file + ' · HTTP ' + response.status)
  try {
    return await response.json() as T
  } catch {
    throw new Error(file + ' · HTTP ' + response.status + ' · некорректный JSON')
  }
}

export function MonitoringProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MonitoringState>({ status: 'loading' })
  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    Promise.all([
      loadJson<Site[]>('sites.json', signal),
      loadJson<{ history: Run[] }>('results.json', signal),
    ]).then(([sites, results]) => {
      if (!signal.aborted) setState({ status: 'ready', data: { sites, history: results.history, audit: null } })
      return loadJson<Audit>('audits.json', signal).then(audit => {
        if (!signal.aborted) setState({ status: 'ready', data: { sites, history: results.history, audit } })
      }).catch(() => {
        // Дополнительная оценка может ещё не появиться. Сводка уже доступна.
      })
    }).catch((error: unknown) => {
      if (signal.aborted) return
      const message = error instanceof Error ? error.message : String(error)
      setState({ status: 'error', message })
    })
    return () => controller.abort()
  }, [])
  return <MonitoringContext.Provider value={state}>{children}</MonitoringContext.Provider>
}
