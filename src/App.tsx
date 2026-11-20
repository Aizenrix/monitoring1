import { NavLink, Route, Routes } from 'react-router'
import { useMonitoring } from './monitoring'
import { formatTime } from './status'
import { SitesPage } from './pages/SitesPage'
import { SitePage } from './pages/SitePage'
import { AboutPage } from './pages/AboutPage'
import { NotFoundPage } from './pages/NotFoundPage'

function Header() {
  const monitoring = useMonitoring()
  const latest = monitoring.status === 'ready' ? monitoring.data.history[0] : undefined
  return (
    <header className="top">
      <div className="frame header">
        <NavLink className="brand" to="/" end>
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          Мониторинг группы
        </NavLink>
        <nav aria-label="Основное меню">
          <NavLink to="/" end>Сайты</NavLink>
          <NavLink to="/about">О проверке</NavLink>
        </nav>
        {latest && (
          <div className="updated">Последняя проверка <time dateTime={latest.time}>{formatTime(latest.time)} МСК</time></div>
        )}
      </div>
    </header>
  )
}

export function App() {
  return (
    <>
      <a href="#content" className="skip">К содержимому</a>
      <Header />
      <main className="frame" id="content">
        <Routes>
          <Route path="/" element={<SitesPage />} />
          <Route path="/site/:id" element={<SitePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <footer className="frame footer">Мониторинг сайтов группы <span>GitHub Actions · GitHub Pages</span></footer>
    </>
  )
}
