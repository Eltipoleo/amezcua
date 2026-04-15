import { useState, useCallback, useEffect, useRef } from "react"
import UserLayout from "../components/UserLayout"
import ErrorMessage from "../components/ErrorMessage"
import { debounce, createScrollAnimationObserver } from "../utils/helpers"

const CATEGORIAS = [
  "Pecho",
  "Espalda",
  "Hombros",
  "Biceps",
  "Triceps",
  "Piernas",
  "Abdomen",
  "Cardio",
  "Otro"
]

export default function UsuarioEjercicios() {
  const [ejercicios, setEjercicios] = useState([
    { id: 1, nombre: "Press de banca", categoria: "Pecho", series: 4, repeticiones: 12, peso: "60 kg", fecha: "2026-02-17" },
    { id: 2, nombre: "Sentadilla", categoria: "Piernas", series: 4, repeticiones: 10, peso: "80 kg", fecha: "2026-02-17" },
    { id: 3, nombre: "Peso muerto", categoria: "Espalda", series: 3, repeticiones: 8, peso: "100 kg", fecha: "2026-02-16" },
    { id: 4, nombre: "Curl de biceps", categoria: "Biceps", series: 3, repeticiones: 12, peso: "15 kg", fecha: "2026-02-16" },
  ])
  const [filteredEjercicios, setFilteredEjercicios] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [filtro, setFiltro] = useState("Todos")
  const [searchTerm, setSearchTerm] = useState("")
  const [successMsg, setSuccessMsg] = useState(null)
  const [formData, setFormData] = useState({
    nombre: "",
    categoria: "Pecho",
    series: "",
    repeticiones: "",
    peso: "",
    fecha: new Date().toISOString().split("T")[0]
  })

  const statsRef = useRef([])
  const cardRef = useRef(null)

  // IntersectionObserver para animaciones
  useEffect(() => {
    const observer = createScrollAnimationObserver()
    statsRef.current.forEach(card => {
      if (card) observer.observe(card)
    })
    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [])

  // Debounce para busqueda
  const debouncedSearch = useCallback(
    debounce((term, categoria) => {
      aplicarFiltros(term, categoria)
    }, 300),
    [ejercicios]
  )

  const aplicarFiltros = useCallback((search, categoria) => {
    let result = [...ejercicios]

    // Filtro por busqueda
    if (search.trim()) {
      const term = search.toLowerCase()
      result = result.filter(e => 
        e.nombre.toLowerCase().includes(term)
      )
    }

    // Filtro por categoria
    if (categoria !== "Todos") {
      result = result.filter(e => e.categoria === categoria)
    }

    setFilteredEjercicios(result)
  }, [ejercicios])

  useEffect(() => {
    aplicarFiltros(searchTerm, filtro)
  }, [ejercicios, searchTerm, filtro, aplicarFiltros])

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    debouncedSearch(value, filtro)
  }

  const handleFilterChange = (cat) => {
    setFiltro(cat)
    aplicarFiltros(searchTerm, cat)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.nombre || !formData.series || !formData.repeticiones) {
      return
    }

    const nuevo = {
      id: Date.now(),
      ...formData,
      series: parseInt(formData.series),
      repeticiones: parseInt(formData.repeticiones),
    }
    setEjercicios([nuevo, ...ejercicios])
    setFormData({
      nombre: "",
      categoria: "Pecho",
      series: "",
      repeticiones: "",
      peso: "",
      fecha: new Date().toISOString().split("T")[0]
    })
    setShowModal(false)
    setSuccessMsg("Ejercicio registrado correctamente")
  }

  const handleDelete = (id) => {
    setEjercicios(ejercicios.filter(e => e.id !== id))
    setSuccessMsg("Ejercicio eliminado")
  }

  // Group by date
  const grouped = filteredEjercicios.reduce((acc, ej) => {
    if (!acc[ej.fecha]) acc[ej.fecha] = []
    acc[ej.fecha].push(ej)
    return acc
  }, {})

  const fechasOrdenadas = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a))

  return (
    <UserLayout>
      <div className="page-header">
        <h1>Mis Ejercicios</h1>
        <p>Registra y consulta tu rutina de ejercicios</p>
      </div>

      {successMsg && <ErrorMessage message={successMsg} type="success" onClose={() => setSuccessMsg(null)} />}

      {/* Stats con animacion escalonada */}
      <div className="stats-grid">
        {[
          { label: "Ejercicios Registrados", value: ejercicios.length },
          { label: "Sesiones Unicas", value: Object.keys(ejercicios.reduce((acc, e) => { acc[e.fecha] = true; return acc }, {})).length },
          { label: "Categorias Usadas", value: new Set(ejercicios.map(e => e.categoria)).size }
        ].map((stat, index) => (
          <div 
            key={stat.label}
            className={`stat-card animate-on-scroll hover-lift stagger-${index + 1}`}
            ref={el => statsRef.current[index] = el}
          >
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="card animate-on-scroll" ref={cardRef}>
        <div className="card-header" style={{ flexDirection: "column", alignItems: "stretch", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="card-title">Historial de Ejercicios</div>
              <div className="card-subtitle">
                {filteredEjercicios.length} de {ejercicios.length} ejercicios
                {filtro !== "Todos" ? ` en ${filtro}` : ""}
              </div>
            </div>
            <button className="btn btn-primary magnetic-btn" onClick={() => setShowModal(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Registrar Ejercicio
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
              placeholder="Buscar ejercicio..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <button className="search-clear" onClick={() => { setSearchTerm(""); aplicarFiltros("", filtro) }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Filtros con estilo mejorado */}
          <div className="filter-bar">
            <button
              className={`filter-btn ${filtro === "Todos" ? "active" : ""}`}
              onClick={() => handleFilterChange("Todos")}
            >
              Todos
            </button>
            {CATEGORIAS.map(cat => (
              <button
                key={cat}
                className={`filter-btn ${filtro === cat ? "active" : ""}`}
                onClick={() => handleFilterChange(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredEjercicios.length === 0 ? (
          <div className="empty-state">
            <h3>{searchTerm || filtro !== "Todos" ? "Sin resultados" : "Sin ejercicios"}</h3>
            <p>{searchTerm || filtro !== "Todos" ? "No hay ejercicios que coincidan con tu busqueda." : "No hay ejercicios registrados. Registra el primero."}</p>
          </div>
        ) : (
          fechasOrdenadas.map((fecha, dateIndex) => (
            <div 
              key={fecha} 
              className={`animate-on-scroll stagger-${Math.min(dateIndex + 1, 5)}`}
              style={{ marginBottom: 24 }}
            >
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 10,
                paddingBottom: 8,
                borderBottom: "1px solid var(--color-border)"
              }}>
                {fecha}
              </div>
              <div className="exercise-list">
                {grouped[fecha].map((ej, ejIndex) => (
                  <div 
                    className="exercise-item hover-lift" 
                    key={ej.id}
                    style={{ 
                      animationDelay: `${ejIndex * 0.05}s`,
                      transition: "transform 0.2s ease, box-shadow 0.2s ease"
                    }}
                  >
                    <div className="exercise-info">
                      <div className="exercise-name">{ej.nombre}</div>
                      <div className="exercise-details">
                        {ej.categoria} &middot; {ej.series} series x {ej.repeticiones} reps
                        {ej.peso && ` &middot; ${ej.peso}`}
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => handleDelete(ej.id)}
                      title="Eliminar"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Nuevo Ejercicio */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Registrar Ejercicio</div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nombre del ejercicio *</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Ej: Press de banca"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Categoria</label>
                <select
                  className="form-input"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                >
                  {CATEGORIAS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Series *</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    placeholder="4"
                    value={formData.series}
                    onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Repeticiones *</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    placeholder="12"
                    value={formData.repeticiones}
                    onChange={(e) => setFormData({ ...formData, repeticiones: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Peso</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Ej: 60 kg"
                    value={formData.peso}
                    onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Fecha</label>
                  <input
                    className="form-input"
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Ejercicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </UserLayout>
  )
}
