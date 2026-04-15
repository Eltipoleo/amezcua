import { useState, useEffect } from 'react';
import { getSettingsData, updatePreferences, changePassword, closeSession } from '../services/userService';

function Configuracion() {
  const [prefs, setPrefs] = useState({ tema: 'light', idioma: 'es', mfa_enabled: false });
  const [sesiones, setSesiones] = useState([]);
  const [passwords, setPasswords] = useState({ old_password: '', new_password: '' });
  const [mensaje, setMensaje] = useState({ text: '', type: '' });

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const data = await getSettingsData();
    if (data && data.success) {
      // Forzamos boolean para el toggle de MFA
      setPrefs({ ...data.prefs, mfa_enabled: data.prefs.mfa_enabled == 1 });
      setSesiones(data.sesiones);
    }
  };

  const handlePrefChange = async (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    const nuevasPrefs = { ...prefs, [name]: val };
    
    setPrefs(nuevasPrefs);
    const res = await updatePreferences(nuevasPrefs);
    if (res.success) mostrarMensaje("Preferencias actualizadas", "success");
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const res = await changePassword(passwords);
    if (res.success) {
      mostrarMensaje("Contraseña actualizada exitosamente", "success");
      setPasswords({ old_password: '', new_password: '' });
    } else {
      mostrarMensaje(res.message, "error");
    }
  };

  const handleCloseSession = async (id) => {
    const res = await closeSession(id);
    if (res.success) {
      mostrarMensaje("Sesión remota cerrada", "success");
      cargarDatos(); // Recargar la lista
    }
  };

  const mostrarMensaje = (text, type) => {
    setMensaje({ text, type });
    setTimeout(() => setMensaje({ text: '', type: '' }), 3000);
  };

  return (
    <div className="config-container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Configuración de Cuenta</h1>
      {mensaje.text && (
        <div style={{ padding: '10px', backgroundColor: mensaje.type === 'error' ? '#ffcccc' : '#ccffcc', marginBottom: '20px' }}>
          {mensaje.text}
        </div>
      )}

      {/* SECCIÓN PREFERENCIAS */}
      <section style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px' }}>
        <h3>Preferencias e Idioma</h3>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <label>
            Tema:
            <select name="tema" value={prefs.tema} onChange={handlePrefChange} style={{ marginLeft: '10px' }}>
              <option value="light">Claro</option>
              <option value="dark">Oscuro</option>
            </select>
          </label>
          <label>
            Idioma:
            <select name="idioma" value={prefs.idioma} onChange={handlePrefChange} style={{ marginLeft: '10px' }}>
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>
      </section>

      {/* SECCIÓN MFA */}
      <section style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px' }}>
        <h3>Autenticación de Dos Factores (MFA)</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input 
            type="checkbox" 
            name="mfa_enabled" 
            checked={prefs.mfa_enabled} 
            onChange={handlePrefChange} 
          />
          Habilitar MFA para mayor seguridad
        </label>
        <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
          (En un entorno real, esto mostraría un código QR para Google Authenticator).
        </small>
      </section>

      {/* SECCIÓN CAMBIO DE CONTRASEÑA */}
      <section style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px' }}>
        <h3>Cambiar Contraseña</h3>
        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input 
            type="password" 
            placeholder="Contraseña Actual" 
            value={passwords.old_password}
            onChange={(e) => setPasswords({...passwords, old_password: e.target.value})}
            required 
          />
          <input 
            type="password" 
            placeholder="Nueva Contraseña" 
            value={passwords.new_password}
            onChange={(e) => setPasswords({...passwords, new_password: e.target.value})}
            required 
          />
          <button type="submit" style={{ width: 'fit-content' }}>Actualizar Contraseña</button>
        </form>
      </section>

      {/* SECCIÓN SESIONES ACTIVAS */}
      <section style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px' }}>
        <h3>Sesiones Activas</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {sesiones.map(ses => (
            <li key={ses.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' }}>
              <div>
                <strong>{ses.ip}</strong> - {ses.dispositivo.substring(0, 40)}...
                <br /><small>Iniciada: {ses.fecha_inicio}</small>
              </div>
              <button onClick={() => handleCloseSession(ses.id)} style={{ backgroundColor: 'red', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>
                Cerrar Sesión
              </button>
            </li>
          ))}
          {sesiones.length === 0 && <p>No hay sesiones activas registradas.</p>}
        </ul>
      </section>
    </div>
  );
}

export default Configuracion;