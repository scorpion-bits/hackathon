import { Route, Routes } from 'react-router-dom'
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

export default function ProtoApp() {
  return (
    <Routes>
      <Route path="entrar" element={<Login />} />
      <Route path="entrevista" element={<Interview />} />
      <Route path="mapa" element={<Shell full><NeedsFields where="Mapa vivo"><LiveMap /></NeedsFields></Shell>} />
      <Route path="talhoes" element={<Shell full><FieldsEditor /></Shell>} />
      <Route path="dados" element={<Shell><OpenData /></Shell>} />
      <Route path="propriedade" element={<Shell><NeedsFields where="Minha propriedade"><Property /></NeedsFields></Shell>} />
      <Route path="assistente" element={<Shell><Assistant /></Shell>} />
      <Route path="resolver/:id" element={<Shell><Resolve /></Shell>} />
      <Route path="casos" element={<Shell><Cases /></Shell>} />
      <Route path="contexto" element={<Shell><ContextPage /></Shell>} />
      <Route path="*" element={<Shell><NeedsFields><ForYou /></NeedsFields></Shell>} />
    </Routes>
  )
}
