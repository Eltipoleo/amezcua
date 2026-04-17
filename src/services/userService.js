import { cacheService, abortManager } from "../utils/helpers";

// URL MAESTRA apuntando a tu API en Railway
const BASE_URL = "https://apigym-production.up.railway.app/index.php?url=";

// Helper para obtener token actual
const getAccessToken = () => localStorage.getItem('access_token');
const setAccessToken = (token) => localStorage.setItem('access_token', token);

// =============================================
// FETCH CON INTERCEPTOR PARA JWT Y MANEJO DE ERRORES (Mutaciones)
// =============================================
async function fetchWithAbort(url, options = {}, abortKey = null, isRetry = false) {
  const fetchOptions = { 
    ...options,
    credentials: "include", 
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getAccessToken()}`
    }
  };
  
  if (abortKey) fetchOptions.signal = abortManager.create(abortKey);

  try {
    const res = await fetch(url, fetchOptions);
    
    // Interceptor: Si el token expira (401)
    if (res.status === 401 && !isRetry) {
      console.log("[v0] Token expirado, intentando refrescar...");
      let refreshRes = await fetch(`${BASE_URL}refresh`, {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (refreshRes.ok) {
         // Si el refresh funciona, reintentamos la petición original
         return fetchWithAbort(url, options, abortKey, true);
      } else {
         throw new Error("Sesión expirada");
      }
    }

    if (!res.ok) {
      if (res.status === 401) {
        res.text().then(body => console.log("[v0] 401 Response body:", body));
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`[v0] Petición cancelada: ${abortKey || url}`);
      return null;
    }
    throw error;
  }
}

// =============================================
// LOGIN (ACTUALIZADO PARA GUARDAR ID)
// =============================================
export const loginUsuario = async (email, password) => {
  const res = await fetch(`${BASE_URL}login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  // Si el login es exitoso, guardamos los datos críticos en el navegador
  if (data.success) {
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('userId', data.id); // <--- ESTO ES LO QUE NECESITA EL DASHBOARD
    localStorage.setItem('rol', data.rol);
    localStorage.setItem('userName', data.nombre);
  }

  return data;
};

// =============================================
// OBTENER USUARIOS (CONEXIÓN DIRECTA Y EXTRACCIÓN QUIRÚRGICA)
// =============================================
export const obtenerUsuarios = async (forceRefresh = false) => {
  const cacheKey = "usuarios";
  
  if (!forceRefresh && cacheService.has(cacheKey)) {
    return cacheService.get(cacheKey);
  }

  try {
    const res = await fetchWithAbort(`${BASE_URL}get_usuarios`, {
      method: 'GET'
    });

    if (!res) throw new Error("Error en la red");

    const rawText = typeof res === 'string' ? res : JSON.stringify(res);

    // BLINDAJE: Extraer únicamente el JSON, pase lo que pase
    const start = rawText.indexOf('[');
    const end = rawText.lastIndexOf(']');

    let usuarios = [];
    if (start !== -1 && end !== -1) {
      const jsonLimpio = rawText.substring(start, end + 1);
      usuarios = JSON.parse(jsonLimpio);
    } else {
      const startObj = rawText.indexOf('{');
      const endObj = rawText.lastIndexOf('}');
      if (startObj !== -1 && endObj !== -1) {
        const jsonObj = rawText.substring(startObj, endObj + 1);
        const parsed = JSON.parse(jsonObj);
        usuarios = parsed.data || parsed.usuarios || [];
      }
    }

    cacheService.set(cacheKey, usuarios);
    return usuarios;
  } catch (error) {
    console.error("❌ Error en obtenerUsuarios:", error);
    return [];
  }
};

export const getUsuarios = obtenerUsuarios;

// =============================================
// OBTENER PUBLICACIONES (EXTRACTOR BLINDADO)
// =============================================
export const obtenerPublicaciones = async () => {
  try {
    const res = await fetchWithAbort(`${BASE_URL}get_publicaciones`, {
      method: 'GET'
    });

    if (!res) throw new Error("Error en la red");

    const rawText = typeof res === 'string' ? res : JSON.stringify(res);

    const start = rawText.indexOf('[');
    const end = rawText.lastIndexOf(']');

    let publicaciones = [];
    if (start !== -1 && end !== -1) {
      const jsonLimpio = rawText.substring(start, end + 1);
      publicaciones = JSON.parse(jsonLimpio);
    } else {
      const startObj = rawText.indexOf('{');
      const endObj = rawText.lastIndexOf('}');
      if (startObj !== -1 && endObj !== -1) {
        const jsonObj = rawText.substring(startObj, endObj + 1);
        const parsed = JSON.parse(jsonObj);
        publicaciones = parsed.publicaciones || parsed.data || [];
      }
    }

    return publicaciones;
  } catch (error) {
    console.error("❌ Error en obtenerPublicaciones:", error);
    return [];
  }
};

// =============================================
// DASHBOARD DATA
// =============================================
export const obtenerDashboardDataSafe = async () => {
  const results = await Promise.allSettled([
    obtenerUsuarios(true),
    obtenerPublicaciones()
  ]);

  const [usuariosResult, publicacionesResult] = results;

  return {
    success: true,
    usuarios: usuariosResult.status === 'fulfilled' ? usuariosResult.value : [],
    publicaciones: publicacionesResult.status === 'fulfilled' ? publicacionesResult.value : [],
    errores: results
      .filter(r => r.status === 'rejected')
      .map(r => r.reason?.message || 'Error desconocido')
  };
};

export const obtenerDashboardData = async () => {
  try {
    const [usuarios, publicaciones] = await Promise.all([
      obtenerUsuarios(true),
      obtenerPublicaciones()
    ]);
    return { success: true, usuarios, publicaciones };
  } catch (error) {
    return { success: false, error: error.message, usuarios: [], publicaciones: [] };
  }
};

// =============================================
// CREAR USUARIO
// =============================================
export const crearUsuario = async (usuario) => {
  cacheService.invalidate("usuarios");
  return fetchWithAbort(`${BASE_URL}create_usuario`, {
    method: "POST",
    body: JSON.stringify({
      nombre: usuario.nombre,
      email: usuario.email,
      password: usuario.password || "",
      fecha_vencimiento: usuario.fecha_vencimiento
    })
  });
};

// =============================================
// ACTUALIZAR USUARIO
// =============================================
export const actualizarUsuario = async (usuario) => {
  cacheService.invalidate("usuarios");
  return fetchWithAbort(`${BASE_URL}update_usuarios`, {
    method: "POST",
    body: JSON.stringify({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      fecha_vencimiento: usuario.fecha_vencimiento
    })
  });
};

// =============================================
// AGREGAR TIEMPO
// =============================================
export const addTiempo = async (id, dias) => {
  cacheService.invalidate("usuarios");
  return fetchWithAbort(`${BASE_URL}add_tiempo`, {
    method: "POST",
    body: JSON.stringify({ id, dias })
  });
};

// =============================================
// ACTUALIZAR FECHA
// =============================================
export const updateFecha = async (id, fecha) => {
  cacheService.invalidate("usuarios");
  return fetchWithAbort(`${BASE_URL}update_fecha`, {
    method: "POST",
    body: JSON.stringify({ id, fecha })
  });
};

// =============================================
// ELIMINAR USUARIO
// =============================================
export const deleteUsuario = async (id) => {
  cacheService.invalidate("usuarios");
  return fetchWithAbort(`${BASE_URL}delete_usuario`, {
    method: "POST",
    body: JSON.stringify({ id })
  });
};

// =============================================
// CANCELAR TODAS LAS PETICIONES
// =============================================
export const cancelarPeticiones = () => {
  abortManager.abortAll();
};

// --- FUNCIONES DE CONFIGURACIÓN DE USUARIO ---
export const getSettingsData = () => {
  return fetchWithAbort(`${BASE_URL}user_settings&action=get_data`, { method: "GET" });
};

export const updatePreferences = (prefs) => {
  return fetchWithAbort(`${BASE_URL}user_settings&action=update_prefs`, {
    method: "POST", body: JSON.stringify(prefs)
  });
};

export const changePassword = (passwords) => {
  return fetchWithAbort(`${BASE_URL}user_settings&action=change_password`, {
    method: "POST", body: JSON.stringify(passwords)
  });
};

export const closeSession = (sesion_id) => {
  return fetchWithAbort(`${BASE_URL}user_settings&action=close_session`, {
    method: "POST", body: JSON.stringify({ sesion_id })
  });
};

// =============================================
// REGISTRO PÚBLICO DE USUARIOS
// =============================================
export const registerUsuario = async (nombre, email, password) => {
  const res = await fetch(`${BASE_URL}registro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, email, password })
  });
  return res.json();
};

export const verificarCuenta = async (email, codigo) => {
  const res = await fetch(`${BASE_URL}verificar_codigo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, codigo })
  });
  return res.json();
};

// =============================================
// RECUPERACIÓN DE CONTRASEÑA
// =============================================
export const requestRecoveryEmail = async (email) => {
  const res = await fetch(`${BASE_URL}recover&action=request_email`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  return res.json();
};

export const requestRecoveryOTP = async (email, method) => {
  const res = await fetch(`${BASE_URL}recover&action=request_otp`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, method })
  });
  return res.json();
};

export const resetPassword = async (email, method, auth_value, new_password) => {
  const res = await fetch(`${BASE_URL}recover&action=reset_password`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, method, auth_value, new_password })
  });
  return res.json();
};
// Agrega esto al final de tu userService.js

export const obtenerDatosPerfil = async () => {
  // Usamos el ID del usuario que guardamos en localStorage al hacer login
  const userId = localStorage.getItem('userId'); 
  
  return fetchWithAbort(`${BASE_URL}get_perfil&id=${userId}`, {
    method: 'GET'
  });
};