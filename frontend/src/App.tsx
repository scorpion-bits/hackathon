import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import Alerts from './pages/Alerts'
import Assistant from './pages/Assistant'
import Dashboard from './pages/Dashboard'
import MapPage from './pages/MapPage'
import Production from './pages/Production'
import Profile from './pages/Profile'
import Reports from './pages/Reports'
import Stock from './pages/Stock'
import Weather from './pages/Weather'
import ProtoApp from './prototype/ProtoApp'

/** AgroBits (ProtoApp) em "/"; app funcional antigo em "/legado" — D-017. */
function FunctionalApp() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/mapa" element={<MapPage />} />
        <Route path="/producao" element={<Production />} />
        <Route path="/estoque" element={<Stock />} />
        <Route path="/clima" element={<Weather />} />
        <Route path="/alertas" element={<Alerts />} />
        <Route path="/relatorios" element={<Reports />} />
        <Route path="/assistente" element={<Assistant />} />
        <Route path="/perfil" element={<Profile />} />
      </Routes>
    </Layout>
  )
}

/** Links antigos /prototipo/... apontam para o mesmo caminho sem o prefixo. */
function OldProtoRedirect() {
  const { pathname, search } = useLocation()
  return <Navigate to={(pathname.replace(/^\/prototipo/, '') || '/') + search} replace />
}

/** App antigo vive em /legado: o roteador é criado com basename, então seus links absolutos continuam valendo. */
export const LEGACY = /^\/legado(\/|$)/.test(window.location.pathname)

export default function App() {
  if (LEGACY) return <FunctionalApp />
  return (
    <Routes>
      <Route path="/prototipo/*" element={<OldProtoRedirect />} />
      <Route path="/*" element={<ProtoApp />} />
    </Routes>
  )
}
