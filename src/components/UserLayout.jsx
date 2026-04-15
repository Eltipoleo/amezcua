import { useNavigate, useLocation } from 'react-router-dom'

function UserLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const userName = localStorage.getItem('userName') || 'Usuario'

  const isActive = (path) => location.pathname === path

  const logout = () => {
    localStorage.removeItem('rol')
    localStorage.removeItem('userName')
    localStorage.removeItem('userId')
    navigate('/')
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>GymPanel</h2>
          <p>{userName}</p>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-link ${isActive('/usuario') ? 'active' : ''}`}
            onClick={() => navigate('/usuario')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Mi Membresia
          </button>

          <button
            className={`sidebar-link ${isActive('/usuario/ejercicios') ? 'active' : ''}`}
            onClick={() => navigate('/usuario/ejercicios')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 20V10" />
              <path d="M12 20V4" />
              <path d="M6 20v-6" />
            </svg>
            Mis Ejercicios
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-link" onClick={logout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Cerrar sesion
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

export default UserLayout
