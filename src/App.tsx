import { HashRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Trending } from './pages/Trending'
import { Search } from './pages/Search'
import { Watch } from './pages/Watch'
import { Channel } from './pages/Channel'
import { Subscriptions } from './pages/Subscriptions'
import { Library } from './pages/Library'
import { Settings } from './pages/Settings'
import { Diagnostic } from './pages/Diagnostic'

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
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
        </Layout>
      </HashRouter>
    </AuthProvider>
  )
}
