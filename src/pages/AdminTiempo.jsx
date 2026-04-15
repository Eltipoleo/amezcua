import { useEffect, useState, useCallback, useRef } from "react"
import { obtenerUsuarios, addTiempo, updateFecha } from "../services/userService"
import AdminLayout from "../components/AdminLayout"
import Loader from "../components/Loader"
import ErrorMessage from "../components/ErrorMessage"
import { debounce, createScrollAnimationObserver } from "../utils/helpers"

export default function AdminTiempo() {
  const [usuarios, setUsuarios] = useState([])
  const [filteredUsuarios, setFilteredUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showModal, setShowModal] = useState(null)
  const [dias, setDias] = useState(30)
  const [nuevaFecha, setNuevaFecha] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  const cardRef = useRef(null)

  useEffect(() => {
    cargarUsuarios()
  }, [])

  // IntersectionObserver
  useEffect(() => {
    const observer = createScrollAnimationObserver()
    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [])

  // Debounce para busqueda
  const debouncedSearch = useCallback(
    debounce((term) => {
      if (!term.trim()) {
        setFilteredUsuarios(usuarios)
        return
      }
      const lower = term.toLowerCase()
      setFilteredUsuarios(
        usuarios.filter(u => 
          u.nombre.toLowerCase().includes(lower) || 
          u.email.toLowerCase().includes(lower)
        )
      )
    }, 300),
    [usuarios]
  )

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    debouncedSearch(value)
  }

  useEffect(() => {
    setFilteredUsuarios(usuarios)
  }, [usuarios])

  const cargarUsuarios = async (showLoader = true) => {
    if (showLoader) setLoading(true)
    else setUpdating(true)

    try {
      const data = await obtenerUsuarios(true)
      setUsuarios(data)
    } catch {
      setError("Error al cargar usuarios")
      setUsuarios([])
    }
    
    setLoading(false)
    setUpdating(false)
  }

  const refetchData = () => cargarUsuarios(false)

  const hoy = new Date()

  const getDiasRestantes = (fecha) => {
    const diff = Math.ceil((new Date(fecha) - hoy) / (1000 * 60 * 60 * 24))
    return diff
  }

  const getEstado = (fecha) => {
    const diff = getDiasRestantes(fecha)
    if (diff < 0) return { label: "Vencido", className: "badge-danger", barClass: "danger" }
    if (diff <= 7) return { label: "Por vencer", className: "badge-warning", barClass: "warning" }
    return { label: "Activo", className: "badge-success", barClass: "success" }
  }

  const handleAgregarDias = async () => {
    if (!showModal) return
    setUpdating(true)
    try {
      const res = await addTiempo(showModal.usuario.id, dias)
      if (!res.success) {
        setError("Error al agregar dias")
      } else {
        setSuccessMsg(`Se agregaron ${dias} dias a ${showModal.usuario.nombre}`)
      }
    } catch {
      setError("Error de conexion con el servidor")
    }
    setShowModal(null)
    setDias(30)
    refetchData()
  }

  const handleCambiarFecha = async () => {
    if (!showModal || !nuevaFecha) return
    setUpdating(true)
    try {
      const res = await updateFecha(showModal.usuario.id, nuevaFecha)
      if (!res.success) {
        setError("Error al cambiar la fecha")
      } else {
        setSuccessMsg(`Fecha actualizada para ${showModal.usuario.nombre}`)
      }
    } catch {
      setError("Error de conexion con el servidor")
    }
    setShowModal(null)
    setNuevaFecha("")
    refetchData()
  }

  return (
    <AdminLayout>
      <div className="page-header">
        <h1>Membresias</h1>
        <p>Administra el tiempo de membresia de cada usuario</p>
      </div>

      {error && <ErrorMessage message={error} type="error" onClose={() => setError(null)} />}
      {successMsg && <ErrorMessage message={successMsg} type="success" onClose={() => setSuccessMsg(null)} />}

      <div className="card animate-on-scroll" ref={cardRef}>
        <div className="card-header" style={{ flexDirection: "column", alignItems: "stretch", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="card-title">Control de Membresias</div>
              <div className="card-subtitle">
                Agrega dias o modifica fechas de vencimiento
                {updating && (
                  <span className="refresh-indicator updating" style={{ marginLeft: 8 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                      <path d="M21 3v5h-5" />
                    </svg>
                    Actualizando...
                  </span>
                )}
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => cargarUsuarios(false)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              Actualizar
            </button>
          </div>

          {/* Buscador con debounce */}
          <div className="search-container">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="search-input"
              type="text"
              placeholder="Buscar usuario..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <button className="search-clear" onClick={() => { setSearchTerm(""); setFilteredUsuarios(usuarios) }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <Loader text="Cargando membresias..." />
        ) : filteredUsuarios.length === 0 ? (
          <div className="empty-state">
            <h3>{searchTerm ? "Sin resultados" : "Sin usuarios"}</h3>
            <p>{searchTerm ? "No hay usuarios que coincidan." : "No hay usuarios registrados."}</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Vencimiento</th>
                  <th>Dias Restantes</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsuarios.map((u) => {
                  const estado = getEstado(u.fecha_vencimiento)
                  const diasRest = getDiasRestantes(u.fecha_vencimiento)
                  const progreso = Math.max(0, Math.min(100, (diasRest / 30) * 100))

                  return (
                    <tr key={u.id}>
                      <td style={{ color: "var(--color-text)", fontWeight: 500 }}>{u.nombre}</td>
                      <td>{u.fecha_vencimiento}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div className="progress-bar-container" style={{ width: 80 }}>
                            <div
                              className={`progress-bar ${estado.barClass}`}
                              style={{ width: `${progreso}%` }}
                            />
                          </div>
                          <span style={{ fontSize: 13, color: "var(--color-text-secondary)", minWidth: 50 }}>
                            {diasRest > 0 ? `${diasRest} dias` : "Vencido"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${estado.className}`}>{estado.label}</span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn btn-success btn-sm hover-lift"
                            onClick={() => {
                              setDias(30)
                              setShowModal({ type: "dias", usuario: u })
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Agregar Dias
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              setNuevaFecha(u.fecha_vencimiento)
                              setShowModal({ type: "fecha", usuario: u })
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            Cambiar Fecha
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Agregar Dias */}
      {showModal?.type === "dias" && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Agregar Dias de Membresia</div>
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14, marginBottom: 16 }}>
              {'Agregar dias a '}
              <strong style={{ color: "var(--color-text)" }}>{showModal.usuario.nombre}</strong>
            </p>

            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {[7, 15, 30, 60, 90].map(d => (
                <button
                  key={d}
                  className={`btn btn-sm hover-lift ${dias === d ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setDias(d)}
                >
                  {d} dias
                </button>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">Dias personalizados</label>
              <input
                className="form-input"
                type="number"
                min="1"
                value={dias}
                onChange={(e) => setDias(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(null)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleAgregarDias} disabled={updating}>
                {updating ? "Guardando..." : `Agregar ${dias} dias`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cambiar Fecha */}
      {showModal?.type === "fecha" && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Cambiar Fecha de Vencimiento</div>
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14, marginBottom: 16 }}>
              {'Modificar fecha de '}
              <strong style={{ color: "var(--color-text)" }}>{showModal.usuario.nombre}</strong>
            </p>

            <div className="form-group">
              <label className="form-label">Nueva fecha de vencimiento</label>
              <input
                className="form-input"
                type="date"
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(null)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleCambiarFecha} disabled={updating}>
                {updating ? "Guardando..." : "Guardar Fecha"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
