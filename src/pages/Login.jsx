import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUsuario, registerUsuario, verificarCuenta } from '../services/userService'

function Login() {
  const navigate = useNavigate()
  
  // Modos: 'login', 'register', 'verify'
  const [mode, setMode] = useState('login')
  
  // Datos del formulario
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [codigo, setCodigo] = useState('')
  
  // Feedback
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setLoading(true)

    try {
      if (mode === 'register') {
        // --- FLUJO DE REGISTRO ---
        const data = await registerUsuario(nombre, email, password)
        if (data.success) {
          setSuccessMsg('Revisa tu bandeja de entrada. Te hemos enviado un código de 6 dígitos.')
          setMode('verify')
          setPassword('')
        } else {
          setError(data.message || 'No se pudo crear la cuenta.')
        }

      } else if (mode === 'verify') {
        // --- FLUJO DE VERIFICACIÓN ---
        const data = await verificarCuenta(email, codigo)
        if (data.success) {
          setSuccessMsg('¡Cuenta verificada! Ahora puedes iniciar sesión.')
          setMode('login')
          setCodigo('')
        } else {
          setError(data.message || 'Código incorrecto.')
        }

      } else {
        // --- FLUJO DE LOGIN ---
        const data = await loginUsuario(email, password)
        if (data.success && data.access_token) {
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('rol', data.rol)
          localStorage.setItem('userName', data.nombre)
          
          if (data.rol === 'admin' || data.rol === 'editor') {
            navigate('/admin')
          } else {
            navigate('/usuario')
          }
        } else {
          setError(data.message || 'Credenciales incorrectas o cuenta no verificada.')
        }
      }
    } catch (err) {
      console.error("Error:", err)
      setError('Error de conexión con el servidor.')
    }

    setLoading(false)
  }

  const changeMode = (newMode) => {
    setMode(newMode)
    setError('')
    setSuccessMsg('')
    if (newMode === 'login') setPassword('')
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>
          {mode === 'login' && 'Iniciar Sesión'}
          {mode === 'register' && 'Crear Cuenta'}
          {mode === 'verify' && 'Verificar Cuenta'}
        </h1>
        <p className="login-subtitle">
          {mode === 'login' && 'Ingresa tus credenciales para continuar'}
          {mode === 'register' && 'Regístrate para comenzar'}
          {mode === 'verify' && `Ingresa el código enviado a ${email}`}
        </p>

        {error && <div className="login-error">{error}</div>}
        {successMsg && <div className="login-error" style={{ backgroundColor: '#ccffcc', color: '#006600', border: '1px solid #009900' }}>{successMsg}</div>}

        <form onSubmit={handleSubmit}>
          
          {mode !== 'verify' && (
            <>
              {mode === 'register' && (
                <div className="form-group">
                  <label className="form-label">Nombre completo</label>
                  <input className="form-input" type="text" placeholder="Tu nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Correo electrónico</label>
                <input className="form-input" type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </>
          )}

          {mode !== 'verify' && (
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input className="form-input" type="password" placeholder="Tu contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          )}

          {mode === 'verify' && (
            <div className="form-group">
              <label className="form-label">Código de 6 dígitos</label>
              <input 
                className="form-input" 
                type="text" 
                maxLength="6"
                style={{ fontSize: '24px', letterSpacing: '5px', textAlign: 'center' }}
                placeholder="000000" 
                value={codigo} 
                onChange={(e) => setCodigo(e.target.value)} 
                required 
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginBottom: '15px' }}>
            {loading ? 'Procesando...' : (mode === 'login' ? 'Ingresar' : mode === 'register' ? 'Registrarme' : 'Verificar')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {mode === 'login' && (
            <>
              <button type="button" onClick={() => changeMode('register')} className="btn-ghost">
                ¿No tienes cuenta? Regístrate
              </button>
              {/* NUEVO: Enlace a la pantalla de recuperación de contraseña */}
              <button type="button" onClick={() => navigate('/recuperar')} className="btn-ghost" style={{ color: '#666' }}>
                ¿Olvidaste tu contraseña?
              </button>
            </>
          )}
          {mode === 'register' && (
            <button type="button" onClick={() => changeMode('login')} className="btn-ghost">¿Ya tienes cuenta? Inicia sesión</button>
          )}
          {mode === 'verify' && (
            <button type="button" onClick={() => changeMode('register')} className="btn-ghost">Volver al registro</button>
          )}
        </div>

      </div>
    </div>
  )
}

export default Login