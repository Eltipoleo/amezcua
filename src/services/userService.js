import { cacheService, abortManager } from "../utils/helpers";

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
      let refreshRes = await fetch(`${API}/refresh.php`, {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      let refreshData = null;
      if (!refreshRes.ok) {
        refreshRes = await fetch(`${API}/refresh.php`, {
          credentials: "include",
          method: "GET"
        });
        if (refreshRes.ok) {
          refreshData = await refreshRes.json();
        }
      } else {
        refreshData = await refreshRes.json();
      }

      const res = await fetch(`${API}/login.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });

      const resUsuarios = await fetchWithAbort(`${API}/get_usuarios.php`, {
        method: 'GET'
      });

      const resPublicaciones = await fetchWithAbort(`${API}/get_publicaciones.php`, {
        method: 'GET'
      });

      return fetchWithAbort(`${API}/create_usuario.php`, {
        method: "POST",
        body: JSON.stringify({
          nombre: usuario.nombre,
          email: usuario.email,
          password: usuario.password || "",
          fecha_vencimiento: usuario.fecha_vencimiento
        })
      });

      return fetchWithAbort(`${API}/update_usuarios.php`, {
        method: "POST",
        body: JSON.stringify({
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          fecha_vencimiento: usuario.fecha_vencimiento
        })
      });

      return fetchWithAbort(`${API}/add_tiempo.php`, {
        method: "POST",
        body: JSON.stringify({ id, dias })
      });

      return fetchWithAbort(`${API}/update_fecha.php`, {
        method: "POST",
        body: JSON.stringify({ id, fecha })
      });

      return fetchWithAbort(`${API}/delete_usuario.php`, {
        method: "POST",
        body: JSON.stringify({ id })
      });

      return fetchWithAbort(`${API}/user_settings.php?action=get_data`, { method: "GET" });

      return fetchWithAbort(`${API}/user_settings.php?action=update_prefs`, {
        method: "POST", body: JSON.stringify(prefs)
      });

      return fetchWithAbort(`${API}/user_settings.php?action=change_password`, {
        method: "POST", body: JSON.stringify(passwords)
      });

      return fetchWithAbort(`${API}/user_settings.php?action=close_session`, {
        method: "POST", body: JSON.stringify({ sesion_id })
      });

      const resRegister = await fetch(`${API}/register.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password })
      });

      const resVerificar = await fetch(`${API}/verificar_codigo.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, codigo })
      });

      const resRecoveryEmail = await fetch(`${API}/recover.php?action=request_email`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const resRecoveryOTP = await fetch(`${API}/recover.php?action=request_otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, method })
      });

      const resResetPassword = await fetch(`${API}/recover.php?action=reset_password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, method, auth_value, new_password })
      });
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
// LOGIN
// =============================================
export const loginUsuario = async (email, password) => {
  const res = await fetch(`/gym-api/login.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password })
  });
  return res.json();
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
    const res = await fetchWithAbort(`${API}/get_usuarios.php`, {
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
    const res = await fetchWithAbort(`${API}/get_publicaciones.php`, {
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
  return fetchWithAbort(`/gym-api/create_usuario.php`, {
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
  return fetchWithAbort(`/gym-api/update_usuarios.php`, {
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
  return fetchWithAbort(`/gym-api/add_tiempo.php`, {
    method: "POST",
    body: JSON.stringify({ id, dias })
  });
};

// =============================================
// ACTUALIZAR FECHA
// =============================================
export const updateFecha = async (id, fecha) => {
  cacheService.invalidate("usuarios");
  return fetchWithAbort(`/gym-api/update_fecha.php`, {
    method: "POST",
    body: JSON.stringify({ id, fecha })
  });
};

// =============================================
// ELIMINAR USUARIO
// =============================================
export const deleteUsuario = async (id) => {
  cacheService.invalidate("usuarios");
  return fetchWithAbort(`/gym-api/delete_usuario.php`, {
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
  return fetchWithAbort(`/gym-api/user_settings.php?action=get_data`, { method: "GET" });
};

export const updatePreferences = (prefs) => {
  return fetchWithAbort(`/gym-api/user_settings.php?action=update_prefs`, {
    method: "POST", body: JSON.stringify(prefs)
  });
};

export const changePassword = (passwords) => {
  return fetchWithAbort(`/gym-api/user_settings.php?action=change_password`, {
    method: "POST", body: JSON.stringify(passwords)
  });
};

export const closeSession = (sesion_id) => {
  return fetchWithAbort(`/gym-api/user_settings.php?action=close_session`, {
    method: "POST", body: JSON.stringify({ sesion_id })
  });
};

// =============================================
// REGISTRO PÚBLICO DE USUARIOS
// =============================================
export const registerUsuario = async (nombre, email, password) => {
  const res = await fetch(`/gym-api/register.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, email, password })
  });
  return res.json();
};

export const verificarCuenta = async (email, codigo) => {
  const res = await fetch(`/gym-api/verificar_codigo.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, codigo })
  });
  return res.json();
};

// =============================================
// RECUPERACIÓN DE CONTRASEÑA (PARTE 7)
// =============================================
export const requestRecoveryEmail = async (email) => {
  const res = await fetch(`/gym-api/recover.php?action=request_email`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  return res.json();
};

export const requestRecoveryOTP = async (email, method) => {
  const res = await fetch(`/gym-api/recover.php?action=request_otp`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, method })
  });
  return res.json();
};

export const resetPassword = async (email, method, auth_value, new_password) => {
  const res = await fetch(`/gym-api/recover.php?action=reset_password`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, method, auth_value, new_password })
  });
  return res.json();
};