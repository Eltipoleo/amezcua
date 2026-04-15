// src/routes/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children, allowedRoles }) {
  const userRole = localStorage.getItem('rol')
  const token = localStorage.getItem('access_token')

  // 1. Si no hay token o rol, redirigir al login
  if (!token || !userRole) {
    return <Navigate to="/" replace />
  }

  // 2. Si el rol del usuario NO está en el arreglo de roles permitidos
  if (!allowedRoles.includes(userRole)) {
    // Redirigir a la vista que le corresponda según su rol para no dejarlo en blanco
    if (userRole === 'admin') return <Navigate to="/admin" replace />
    if (userRole === 'editor') return <Navigate to="/editor" replace /> // Si haces un panel para editor
    return <Navigate to="/usuario" replace />
  }

  // 3. Si tiene permiso, renderizamos la vista protegida
  return children
}

export default ProtectedRoute