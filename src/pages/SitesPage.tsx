import { useState } from 'react'
import { Link } from 'react-router'
import { DataStatus } from '../DataStatus'
import { useMonitoring } from '../monitoring'
import { siteHistory, statusText, statusTone } from '../status'

export function SitesPage() {
  const state = useMonitoring()
  const [onlyDown, setOnlyDown] = useState(false)
  if (state.status !== 'ready') return <DataStatus state={state} />

  const { sites, history } = state.data
  const latestChecks = new Map(history[0]?.checks.map(check => [check.id, check]))
  const total = sites.length
  const healthy = sites.filter(site => latestChecks.get(site.id)?.ok).length
  const down = sites.filter(site => latestChecks.get(site.id)?.ok === false).length
  const waiting = total - healthy - down
  const visible = onlyDown ? sites.filter(site => latestChecks.get(site.id)?.ok === false) : sites
  const title = down > 0 ? 'Не открываются: ' + down + ' из ' + total
    : waiting > 0 || total === 0 ? 'Ожидаем проверку сайтов'
      : 'Все ' + total + ' сайтов открываются'
  return (
    <>
      <section className="overview" aria-labelledby="summary">
        <div className="overview-copy">
          <p className="eyebrow">Сводка доступности</p>
          <h1 id="summary">{title}</h1>
          <p>{waiting > 0 ? 'Ожидают первой проверки: ' + waiting : 'Статусы по результатам последней проверки'}</p>
        </div>
        <dl className="overview-metrics">
          <div><dt>Открываются</dt><dd>{healthy}</dd></div>
          <div><dt>Не открываются</dt><dd>{down}</dd></div>
          <div><dt>Всего сайтов</dt><dd>{total}</dd></div>
        </dl>
      </section>
      <section aria-labelledby="sites">
        <div className="section-head">
          <div>
            <h2 id="sites">Сайты под наблюдением</h2>
            {sites.some(site => site.demo) && <p className="muted">Демонстрационный список до добавления сайтов группы.</p>}
          </div>
          <button className="filter" type="button" aria-pressed={onlyDown} onClick={() => setOnlyDown(!onlyDown)}>
            Только неработающие
          </button>
        </div>
        {visible.length === 0 && <p className="notice">{onlyDown ? 'Сайтов с ошибками нет.' : 'Список сайтов пуст.'}</p>}
        <ul className="cards">
          {visible.map(site => {
            const check = latestChecks.get(site.id)
            const results = siteHistory(history, site.id)
            const up = results.filter(entry => entry.check.ok).length
            return (
              <li key={site.id}>
                <Link className={'site-card ' + statusTone(check)} to={'/site/' + site.id}>
                  <span className={'badge ' + statusTone(check)}>{statusText(check)}</span>
                  <h3>{site.name}</h3>
                  <span className="domain">{new URL(site.url).hostname}</span>
                  <div className="card-footer">
                    {results.length > 0 && <span>Открывался в {Math.round(up / results.length * 100)}% проверок</span>}
                    {check && <span className="mono">{check.ms} мс</span>}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </>
  )
}
