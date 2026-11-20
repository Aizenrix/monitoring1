import { DataStatus } from '../DataStatus'
import { useMonitoring } from '../monitoring'

export function AboutPage() {
  const state = useMonitoring()
  return (
    <>
      <section className="overview detail">
        <div className="overview-copy">
          <p className="eyebrow">Регламент мониторинга</p>
          <h1>О проверке</h1>
          <p>GitHub Actions запускает проверку каждую ночь в 00:00 по Москве. Старт может задержаться из-за очереди.</p>
        </div>
        {state.status === 'ready' && <dl className="overview-metrics"><div><dt>Сайтов в списке</dt><dd>{state.data.sites.length}</dd></div></dl>}
      </section>
      {state.status !== 'ready' && <DataStatus state={state} />}
      <dl className="about-list">
        <div><dt>Как определяется доступность</dt><dd>Проверка открывает адрес, следует перенаправлениям и ждёт ответа до 15 секунд. Успехом считается HTTP 200–299.</dd></div>
        <div><dt>Как обновляется история</dt><dd>Бот GitHub сохраняет в репозитории до 30 последних проверок. После записи GitHub Actions публикует новую версию сайта.</dd></div>
        <div><dt>Когда пишет Telegram</dt><dd>Ночной отчёт сообщает о новых сбоях и восстановлении. В понедельник в 09:00 МСК отдельно приходит сводка за последние семь проверок.</dd></div>
        <div><dt>Что оценивает Lighthouse</dt><dd>Скорость загрузки и доступность интерфейса оцениваются отдельно по шкале от 0 до 100. Время ответа в таблице измеряется при ночной проверке.</dd></div>
      </dl>
    </>
  )
}
