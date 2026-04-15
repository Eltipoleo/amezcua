import { useEffect, useState, useCallback, useRef } from "react"
import { obtenerUsuarios, actualizarUsuario, crearUsuario, deleteUsuario } from "../services/userService"
import AdminLayout from "../components/AdminLayout"
import Loader from "../components/Loader"
import ErrorMessage from "../components/ErrorMessage"
import Toast from "../components/Toast"
import { debounce, createScrollAnimationObserver } from "../utils/helpers"

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [filteredUsuarios, setFilteredUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [error, setError] = useState(null)
  
  // TOAST STATE (Requisito Obligatorio)
  const [toast, setToast] = useState({ message: '', type: '' })
  
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({ nombre: "", email: "", password: "", fecha_vencimiento: "" })

  // PAGINACIÓN (Requisito Obligatorio)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const userRole = localStorage.getItem('rol')
  const cardRef = useRef(null)

  useEffect(() => { cargarUsuarios() }, [])

  useEffect(() => {
    const observer = createScrollAnimationObserver()
    if (cardRef.current) {
      observer.observe(cardRef.current)
    }
    return () => observer.disconnect()
  }, [filteredUsuarios])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const debouncedSearch = useCallback(
    debounce((term) => {
      let result = [...usuarios]
      if (term.trim()) {
        result = result.filter(u => u.nombre.toLowerCase().includes(term.toLowerCase()) || u.email.toLowerCase().includes(term.toLowerCase()))
      }
      setFilteredUsuarios(result)
      setCurrentPage(1) // Resetear página al buscar
    }, 300),
    [usuarios]
  )

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    debouncedSearch(e.target.value)
  }

const cargarUsuarios = async (showLoader = true) => {
    if (showLoader) setLoading(true)
    setError(null)
    
    try {
      const response = await obtenerUsuarios(true)
      
      // BLINDAJE: Verificamos si la respuesta es directamente un arreglo,
      // si viene dentro de 'response.data', 'response.usuarios', o 'response.users'.
      let userData = []
      if (Array.isArray(response)) {
        userData = response
      } else if (response && Array.isArray(response.data)) {
        userData = response.data
      } else if (response && Array.isArray(response.usuarios)) {
        userData = response.usuarios
      } else if (response && Array.isArray(response.users)) {
        userData = response.users
      }

      setUsuarios(userData)
      setFilteredUsuarios(userData)
    } catch (error) {
      console.error("Error al cargar usuarios:", error)
      setUsuarios([])
      setFilteredUsuarios([])
      setError("No se pudieron cargar los usuarios. Revisa la conexión o la API.")
      showToast("Error de conexión al cargar usuarios", "error")
    }
    
    setLoading(false)
  }

  // LOGICA EXPORTAR CSV (Requisito Obligatorio)
  const exportarCSV = () => {
    const cabeceras = ["ID,Nombre,Email,Fecha_Vencimiento"];
    const filas = filteredUsuarios.map(u => `${u.id},${u.nombre},${u.email},${u.fecha_vencimiento}`);
    const csvContent = "data:text/csv;charset=utf-8," + cabeceras.concat(filas).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_usuarios.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Reporte descargado correctamente");
  }

  // LOGICA PAGINACIÓN
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsuarios.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);

  const handleSubmit = async (e) => {
    e.preventDefault()
    setUpdating(true)
    try {
      if (editando) {
        const response = await actualizarUsuario({ id: editando.id, ...formData })
        if (!response.success) throw new Error(response.message)
        showToast("Usuario actualizado correctamente")
      } else {
        const response = await crearUsuario(formData)
        if (!response.success) throw new Error(response.error)
        showToast("Usuario creado correctamente")
      }
    } catch (err) {
      showToast(err.message || "Error al guardar", "error")
    }
    setShowModal(false)
    setUpdating(false)
    cargarUsuarios(false)
  }

  const confirmDeleteUser = async () => {
    if (!confirmDelete) return
    setUpdating(true)
    try {
      await deleteUsuario(confirmDelete.id)
      showToast("Usuario eliminado correctamente")
    } catch {
      showToast("Error al eliminar usuario", "error")
    }
    setConfirmDelete(null)
    setUpdating(false)
    cargarUsuarios(false)
  }

  return (
    <AdminLayout>
      <div className="page-header">
        <h1>Gestión de Usuarios</h1>
      </div>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      {error && <ErrorMessage message={error} type="error" onClose={() => setError(null)} />}

      <div className="card animate-on-scroll" ref={cardRef}>
        <div className="card-header">
          <div className="card-title">Directorio</div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={exportarCSV}>📥 Exportar CSV</button>
            {['admin', 'editor'].includes(userRole) && (
              <button className="btn btn-primary" onClick={() => {setEditando(null); setFormData({}); setShowModal(true);}}>
                + Agregar
              </button>
            )}
          </div>
        </div>

        <input className="search-input" type="text" placeholder="Buscar usuario..." value={searchTerm} onChange={handleSearchChange} style={{ marginBottom: '20px' }} />

        {loading ? <Loader text="Cargando..." /> : (
          <>
            {currentItems.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
                <h3>No hay usuarios registrados</h3>
                <p>Verifica que el servidor esté activo y que la API responda correctamente.</p>
              </div>
            ) : (
              <>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr><th>Nombre</th><th>Email</th><th>Vencimiento</th><th>Acciones</th></tr>
                    </thead>
                    <tbody>
                      {currentItems.map((u) => (
                        <tr key={u.id}>
                          <td>{u.nombre}</td>
                          <td>{u.email}</td>
                          <td>{u.fecha_vencimiento}</td>
                          <td>
                            <div className="action-buttons">
                              <button className="btn btn-ghost btn-sm" onClick={() => {setEditando(u); setFormData(u); setShowModal(true);}}>Editar</button>
                              {userRole === 'admin' && (
                                <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(u)}>Eliminar</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* CONTROLES DE PAGINACIÓN */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '10px 0', borderTop: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    Mostrando {filteredUsuarios.length === 0 ? 0 : indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredUsuarios.length)} de {filteredUsuarios.length}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary btn-sm" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>
                      Anterior
                    </button>
                    <span style={{ padding: '4px 10px', background: 'var(--color-bg-tertiary)', borderRadius: '4px' }}>
                      {currentPage} / {totalPages || 1}
                    </span>
                    <button className="btn btn-secondary btn-sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>
                      Siguiente
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Modal Formulario */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editando ? "Editar" : "Nuevo"} Usuario</h2>
            <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
              <input className="form-input" style={{marginBottom:'10px'}} type="text" placeholder="Nombre" value={formData.nombre || ''} onChange={e => setFormData({...formData, nombre: e.target.value})} required />
              <input className="form-input" style={{marginBottom:'10px'}} type="email" placeholder="Email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} required />
              {!editando && <input className="form-input" style={{marginBottom:'10px'}} type="password" placeholder="Contraseña" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} required />}
              <input className="form-input" style={{marginBottom:'10px'}} type="date" value={formData.fecha_vencimiento || ''} onChange={e => setFormData({...formData, fecha_vencimiento: e.target.value})} required />
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={updating}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar (Requisito Obligatorio) */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Confirmar eliminación</h2>
            <p>¿Seguro que deseas eliminar a <strong>{confirmDelete.nombre}</strong>? Esto no se puede deshacer.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={confirmDeleteUser} disabled={updating}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}