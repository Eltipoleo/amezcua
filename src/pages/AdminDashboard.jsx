import { useEffect, useState } from "react";
import { obtenerDashboardDataSafe } from "../services/userService";
import AdminLayout from "../components/AdminLayout";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [data, setData] = useState({ usuarios: [], publicaciones: [] });
  const [loading, setLoading] = useState(true);
  const [erroresParciales, setErroresParciales] = useState([]);

  // Datos simulados para la gráfica (Requisito Obligatorio)
  const chartData = [
    { mes: 'Ene', usuarios: 4 },
    { mes: 'Feb', usuarios: 7 },
    { mes: 'Mar', usuarios: 12 },
    { mes: 'Abr', usuarios: 18 },
    { mes: 'May', usuarios: 25 },
  ];

  useEffect(() => {
    cargarDatos();
    // No usamos cancelarPeticiones() aquí para evitar la pantalla negra en desarrollo
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setErroresParciales([]);

    const result = await obtenerDashboardDataSafe();
    
    // ==========================================
    // ESTE LOG ES LA CLAVE PARA SABER QUÉ PASA
    // ==========================================
    console.log("🔍 RESPUESTA EXACTA DE LA API:", result);

    // BLINDAJE EXTREMO: Buscamos el arreglo sin importar dónde esté escondido
    let usersArray = [];
    if (result && Array.isArray(result.usuarios)) {
      usersArray = result.usuarios;
    } else if (result && result.usuarios && Array.isArray(result.usuarios.data)) {
      usersArray = result.usuarios.data;
    } else if (result && result.usuarios && Array.isArray(result.usuarios.usuarios)) {
      usersArray = result.usuarios.usuarios; // Por si viene doblemente anidado
    }

    let pubsArray = [];
    if (result && Array.isArray(result.publicaciones)) {
      pubsArray = result.publicaciones;
    } else if (result && result.publicaciones && Array.isArray(result.publicaciones.data)) {
      pubsArray = result.publicaciones.data;
    }

    setData({
      usuarios: usersArray,
      publicaciones: pubsArray
    });

    if (result.errores && result.errores.length > 0) {
      setErroresParciales(result.errores);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <Loader text="Cargando métricas del gimnasio y publicaciones..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="page-header">
        <h1>Dashboard Principal</h1>
        <p>Resumen en tiempo real del sistema</p>
      </div>

      {erroresParciales.length > 0 && (
        <ErrorMessage 
          message={`Ocurrieron errores parciales: ${erroresParciales.join(', ')}`} 
          type="warning" 
        />
      )}

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
        
        {/* TARJETA DE USUARIOS */}
        <div className="card" style={{ flex: 1, minWidth: '300px' }}>
          <div className="card-header">
            <div className="card-title">Usuarios Registrados</div>
            <button className="btn btn-sm btn-secondary" onClick={cargarDatos}>Actualizar (Sin recargar)</button>
          </div>
          <h2 style={{ fontSize: '3rem', margin: '20px 0', color: 'var(--color-primary)' }}>
            {data.usuarios.length}
          </h2>
          <p>Total de miembros activos e inactivos.</p>
        </div>
      </div>

      {/* GRÁFICO RECHARTS */}
      <div className="card animate-on-scroll">
        <div className="card-header"><div className="card-title">Crecimiento de Usuarios (Nuevos por mes)</div></div>
        <div style={{ height: '300px', width: '100%', marginTop: '20px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="mes" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip cursor={{fill: '#222'}} contentStyle={{ backgroundColor: '#111', borderColor: '#333' }} />
              <Bar dataKey="usuarios" fill="var(--color-primary)" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </AdminLayout>
  );
}