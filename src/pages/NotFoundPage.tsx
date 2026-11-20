import { Link } from 'react-router'

export function NotFoundPage({ site = false }: { site?: boolean }) {
  return (
    <section className="notice empty">
      <h1>{site ? 'Сайт не найден' : 'Страница не найдена'}</h1>
      <p>{site ? 'Такого сайта нет в списке мониторинга.' : 'Проверьте адрес или вернитесь к списку сайтов.'}</p>
      <Link className="back" to="/">На главную</Link>
    </section>
  )
}
