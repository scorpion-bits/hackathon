import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useMe } from './api/session'
import './farmStore' // carrega os talhões da conta (API) antes de qualquer tela ler FIELDS
import { NeedsFields } from './components/FirstAccess'
import { Shell } from './components/Shell'
import Assistant from './pages/Assistant'
import Cases from './pages/Cases'
import FieldsEditor from './pages/FieldsEditor'
import ContextPage from './pages/ContextPage'
import ForYou from './pages/ForYou'
import Interview from './pages/Interview'
import LiveMap from './pages/LiveMap'
import Login from './pages/Login'
import OpenData from './pages/OpenData'
import Property from './pages/Property'
import Resolve from './pages/Resolve'
import TechView from './pages/TechView'

/** Quem não está logado (ex.: abriu a raiz pela primeira vez) vai para a tela de entrada. */
function RequireLogin({ children }: { children: ReactNode }) {
  const { status } = useMe()
  return status === 'anon' ? <Navigate to="/entrar" replace /> : <>{children}</>
}

export default function ProtoApp() {
  return (
    <Routes>
      <Route path="entrar" element={<Login />} />
      <Route path="entrevista" element={<RequireLogin><Interview /></RequireLogin>} />
      <Route path="mapa" element={<RequireLogin><Shell full><NeedsFields where="Mapa vivo"><LiveMap /></NeedsFields></Shell></RequireLogin>} />
      <Route path="talhoes" element={<RequireLogin><Shell full><FieldsEditor /></Shell></RequireLogin>} />
      <Route path="dados" element={<RequireLogin><Shell><OpenData /></Shell></RequireLogin>} />
      <Route path="propriedade" element={<RequireLogin><Shell><NeedsFields where="Minha propriedade"><Property /></NeedsFields></Shell></RequireLogin>} />
      <Route path="assistente" element={<RequireLogin><Shell><Assistant /></Shell></RequireLogin>} />
      <Route path="resolver/:id" element={<RequireLogin><Shell><Resolve /></Shell></RequireLogin>} />
      <Route path="tecnico/caso/:id" element={<RequireLogin><Shell><TechView /></Shell></RequireLogin>} />
      <Route path="casos" element={<RequireLogin><Shell><Cases /></Shell></RequireLogin>} />
      <Route path="contexto" element={<RequireLogin><Shell><ContextPage /></Shell></RequireLogin>} />
      <Route path="*" element={<RequireLogin><Shell><NeedsFields><ForYou /></NeedsFields></Shell></RequireLogin>} />
    </Routes>
  )
}
