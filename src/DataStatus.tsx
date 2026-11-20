import type { MonitoringState } from './monitoring'

export function DataStatus({ state }: { state: Exclude<MonitoringState, { status: 'ready' }> }) {
  if (state.status === 'loading') return <p className="notice" role="status">Загружаем данные мониторинга…</p>
  return <p className="notice error" role="alert">Не удалось загрузить данные мониторинга. {state.message}</p>
}
