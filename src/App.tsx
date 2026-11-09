import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Layout, useTheme } from './components/Layout'
import { Home } from './pages/Home'
import { Welcome } from './pages/Welcome'
import { useSettings } from './lib/storage'
import { isAvailable } from './lib/youtube'

// Pages secondaires chargées à la demande : démarrage plus rapide.
const Watch = lazy(() => import('./pages/Watch').then((m) => ({ default: m.Watch })))
const Shorts = lazy(() => import('./pages/Shorts').then((m) => ({ default: m.Shorts })))
const Search = lazy(() => import('./pages/Search').then((m) => ({ default: m.Search })))
const Trending = lazy(() => import('./pages/Trending').then((m) => ({ default: m.Trending })))
const Channel = lazy(() => import('./pages/Channel').then((m) => ({ default: m.Channel })))
const Subscriptions = lazy(() => import('./pages/Subscriptions').then((m) => ({ default: m.Subscriptions })))
const Library = lazy(() => import('./pages/Library').then((m) => ({ default: m.Library })))
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })))
const Diagnostic = lazy(() => import('./pages/Diagnostic').then((m) => ({ default: m.Diagnostic })))

// Précharge les pages les plus utilisées dès que l'accueil est affiché.
setTimeout(() => [import('./pages/Watch'), import('./pages/Shorts'), import('./pages/Search')], 1500)

export default function App() {
  const { onboarded } = useSettings()
  useTheme()
  if (!onboarded && isAvailable()) return <Welcome />
  return (
    <HashRouter>
      <Layout>
        <Suspense fallback={<div className="page" />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shorts" element={<Shorts />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/search" element={<Search />} />
            <Route path="/watch/:id" element={<Watch />} />
            <Route path="/channel/:id" element={<Channel />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/library" element={<Library />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/diagnostic" element={<Diagnostic />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </Layout>
    </HashRouter>
  )
}
