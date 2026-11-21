import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.tsx'
import Inicio from './page/Inicio.tsx'
import { RECUPERAR_CONTRASENA } from './config.ts'

// Cada página se descarga solo cuando se visita, para que la app cargue más rápido.
const Register = lazy(() => import('./page/Register.tsx'))
const Login = lazy(() => import('./page/Login.tsx'))
const Recuperar = lazy(() => import('./page/Recuperar.tsx'))
const Restablecer = lazy(() => import('./page/Restablecer.tsx'))
const AreaPrivada = lazy(() => import('./components/AreaPrivada.tsx'))
const Perfil = lazy(() => import('./page/Perfil.tsx'))
const Transcribir = lazy(() => import('./page/Transcribir.tsx'))
const Historial = lazy(() => import('./page/Historial.tsx'))
const Consulta = lazy(() => import('./page/Consulta.tsx'))

/** Lleva la antigua /perfil (enlaces de correos ya enviados) a /app/perfil. */
function RedirigirPerfil() {
  // No se reenvía el hash: podría llevar tokens o datos de sesión.
  const { search } = useLocation()
  return <Navigate to={{ pathname: '/app/perfil', search }} replace />
}

function App() {
  return (
    <Router>
      <Navbar />
      <Suspense fallback={null}>
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
      </Suspense>
    </Router>
  )
}

export default App
