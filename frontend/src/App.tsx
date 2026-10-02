import { Route, Routes } from 'react-router-dom'
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

/** App funcional (backend real) em "/"; protótipo visual (dados de exemplo) em "/prototipo" — D-009. */
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

export default function App() {
  return (
    <Routes>
      <Route path="/prototipo/*" element={<ProtoApp />} />
      <Route path="/*" element={<FunctionalApp />} />
    </Routes>
  )
}
