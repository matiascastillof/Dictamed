import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.tsx'
import AreaPrivada from './components/AreaPrivada.tsx'
import Inicio from './page/Inicio.tsx'
import Register from './page/Register.tsx'
import Login from './page/Login.tsx'
import Recuperar from './page/Recuperar.tsx'
import Restablecer from './page/Restablecer.tsx'
import Perfil from './page/Perfil.tsx'
import Transcribir from './page/Transcribir.tsx'
import Historial from './page/Historial.tsx'
import Consulta from './page/Consulta.tsx'
import { RECUPERAR_CONTRASENA } from './config.ts'

/** Lleva la antigua /perfil (enlaces de correos ya enviados) a /app/perfil. */
function RedirigirPerfil() {
  const { search, hash } = useLocation()
  return <Navigate to={{ pathname: '/app/perfil', search, hash }} replace />
}

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/login" element={<Login />} />
        {RECUPERAR_CONTRASENA && <Route path="/recuperar" element={<Recuperar />} />}
        {RECUPERAR_CONTRASENA && <Route path="/restablecer" element={<Restablecer />} />}

        {/* Solo usuarios registrados */}
        <Route path="/app" element={<AreaPrivada />}>
          <Route index element={<Navigate to="transcribir" replace />} />
          <Route path="transcribir" element={<Transcribir />} />
          <Route path="consulta" element={<Consulta />} />
          <Route path="historial" element={<Historial />} />
          <Route path="perfil" element={<Perfil />} />
        </Route>
        <Route path="/perfil" element={<RedirigirPerfil />} />

        <Route path="*" element={<Inicio />} />
      </Routes>
    </Router>
  )
}

export default App
