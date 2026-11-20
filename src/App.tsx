import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.tsx'
import Inicio from './page/Inicio.tsx'
import Register from './page/Register.tsx'
import Login from './page/Login.tsx'

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Inicio />} />
      </Routes>
    </Router>
  )
}

export default App
