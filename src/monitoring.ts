import { createContext, useContext } from 'react'

export type Site = { id: string; name: string; url: string; demo?: boolean }
export type Check = { id: string; ok: boolean; status: number; ms: number; error: string; title?: string }
export type Run = { time: string; checks: Check[] }
export type Audit = { time: string; scores: Record<string, { performance: number; accessibility: number }> }
export type MonitoringData = { sites: Site[]; history: Run[]; audit: Audit | null }

export type MonitoringState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: MonitoringData }

export const MonitoringContext = createContext<MonitoringState | null>(null)

export function useMonitoring() {
  const state = useContext(MonitoringContext)
  if (state === null) throw new Error('useMonitoring требует MonitoringProvider')
  return state
}
