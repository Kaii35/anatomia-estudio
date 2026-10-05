import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Inspector } from './pages/Inspector'
import { Practice } from './pages/Practice'
import { Progress } from './pages/Progress'
import { RegionPage } from './pages/RegionPage'
import { useProgress } from './store/progress'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  const theme = useProgress((s) => s.theme)
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return (
    <HashRouter>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/region/:id" element={<RegionPage />} />
          <Route path="/practica" element={<Practice />} />
          <Route path="/progreso" element={<Progress />} />
          <Route path="/modelos" element={<Inspector />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}
