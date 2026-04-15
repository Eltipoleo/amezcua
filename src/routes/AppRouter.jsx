import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/Login";
import AdminDashboard from "../pages/AdminDashboard";
import AdminUsuarios from "../pages/AdminUsuarios";
import AdminTiempo from "../pages/AdminTiempo";
import UsuarioDashboard from "../pages/UsuarioDashboard";
import UsuarioEjercicios from "../pages/UsuarioEjercicios";

// Importamos la vista de configuración (PARTE 3)
import Configuracion from "../pages/Configuracion"; 

// IMPORTANTE: Importamos la vista de recuperación de contraseña (PARTE 7)
import RecuperarPassword from "../pages/RecuperarPassword"; 

import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* RUTAS PÚBLICAS */}
        <Route path="/" element={<Login />} />
        {/* Nueva ruta para recuperar contraseña */}
        <Route path="/recuperar" element={<RecuperarPassword />} />

        {/* ADMIN & EDITOR ROUTES */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin', 'editor']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute allowedRoles={['admin', 'editor']}>
              <AdminUsuarios />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tiempo"
          element={
            <ProtectedRoute allowedRoles={['admin', 'editor']}>
              <AdminTiempo />
            </ProtectedRoute>
          }
        />

        {/* USUARIO ROUTES */}
        <Route
          path="/usuario"
          element={
            <ProtectedRoute allowedRoles={['usuario']}>
              <UsuarioDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuario/ejercicios"
          element={
            <ProtectedRoute allowedRoles={['usuario']}>
              <UsuarioEjercicios />
            </ProtectedRoute>
          }
        />

        {/* CONFIGURACIÓN ROUTE - Accesible para cualquier usuario logueado */}
        <Route
          path="/configuracion"
          element={
            <ProtectedRoute allowedRoles={['admin', 'editor', 'usuario']}>
              <Configuracion />
            </ProtectedRoute>
          }
        />

        {/* Ruta no encontrada */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;