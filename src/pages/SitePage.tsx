import { Link, useParams } from 'react-router'
import { DataStatus } from '../DataStatus'
import { useMonitoring } from '../monitoring'
import { formatTime, siteHistory, statusText, statusTone } from '../status'
import { NotFoundPage } from './NotFoundPage'

export function SitePage() {
  const { id } = useParams()
  const state = useMonitoring()
  if (state.status !== 'ready') return <DataStatus state={state} />
  const { sites, history, audit } = state.data
  const site = sites.find(site => site.id === id)
  if (!site) return <NotFoundPage site />
  const entries = siteHistory(history, site.id)
  const latest = history[0]?.checks.find(check => check.id === site.id)
  const title = entries.find(entry => entry.check.title)?.check.title
  const up = entries.filter(entry => entry.check.ok).length
  const maxMs = Math.max(1, ...entries.map(entry => entry.check.ms))
  const score = audit?.scores[site.id]
  return (
    <>
      <Link to="/" className="back">Все сайты</Link>
      <section className="overview detail">
        <div className="overview-copy">
          <span className={'badge ' + statusTone(latest)}>{statusText(latest)}</span>
          <h1>{site.name}</h1>
          <a className="site-url" href={site.url} target="_blank" rel="noreferrer">{site.url}</a>
          {title && <p>Заголовок страницы <strong>{title}</strong></p>}
        </div>
        <dl className="overview-metrics">
          <div><dt>Успешных проверок</dt><dd>{up}<small> из {entries.length}</small></dd></div>
          <div><dt>Последний ответ</dt><dd>{latest ? latest.ms : '—'}{latest && <small> мс</small>}</dd></div>
        </dl>
      </section>
      {score && audit && (
        <section aria-labelledby="scores" className="scores">
          <div className="section-head">
            <div><h2 id="scores">Оценки Lighthouse</h2><p className="muted">{formatTime(audit.time)} МСК</p></div>
          </div>
          <dl className="score-grid">
            <div><dt>Скорость</dt><dd>{score.performance}<small> / 100</small></dd></div>
            <div><dt>Доступность интерфейса</dt><dd>{score.accessibility}<small> / 100</small></dd></div>
          </dl>
        </section>
      )}
      <section aria-labelledby="history">
        <div className="section-head"><h2 id="history">История проверок</h2><span className="muted">Последние {entries.length}</span></div>
        {entries.length === 0 ? <p className="notice">Проверок этого сайта пока нет.</p> : (
          <div className="table-wrap" tabIndex={0} role="region" aria-label="История проверок сайта">
            <table>
              <thead><tr><th scope="col">Время · МСК</th><th scope="col">Результат</th><th scope="col">Время ответа</th></tr></thead>
              <tbody>
                {entries.map(({ time, check }, index) => (
                  <tr key={time + '-' + index} className={check.ok ? undefined : 'bad-row'}>
                    <td><time dateTime={time}>{formatTime(time)}</time></td>
                    <td><span className={'badge ' + statusTone(check)}>{statusText(check)}</span></td>
                    <td>
                      <div className="timing">
                        <span className="mono">{check.ms} мс</span>
                        <span className="track" aria-hidden="true"><span style={{ width: check.ms / maxMs * 100 + '%' }} /></span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
