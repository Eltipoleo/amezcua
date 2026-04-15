import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { requestRecoveryEmail, requestRecoveryOTP, resetPassword } from '../services/userService';

function RecuperarPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [method, setMethod] = useState(''); // email, question, sms, call
  const [authValue, setAuthValue] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  // Detectar si venimos desde el enlace del correo electrónico
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const mail = params.get('email');
    if (token && mail) {
      setEmail(mail);
      setMethod('email');
      setAuthValue(token);
      setStep(3); // Saltar directo a poner la nueva contraseña
    }
  }, [location]);

  const showMsg = (text, type = 'error') => setMessage({ text, type });


// PASO 1: Elegir método
  const handleMethodSelect = async (selectedMethod) => {
    if (!email) return showMsg("Ingresa tu correo primero.");
    setLoading(true);
    setMethod(selectedMethod);

    if (selectedMethod === 'email') {
      const res = await requestRecoveryEmail(email);
      if (res.success) {
        showMsg("Revisa tu correo. Haz clic en el enlace para continuar.", "success");
      } else {
        showMsg(res.message);
      }
    } else if (selectedMethod === 'sms' || selectedMethod === 'call') {
      // --- CAMBIO AQUÍ: FLUJO REAL SIN SIMULACIÓN ---
      const res = await requestRecoveryOTP(email, selectedMethod);
      if (res.success) {
        showMsg("Código enviado. Por favor revisa tu dispositivo móvil.", "success");
        setStep(2); // Pasamos al paso de escribir el código
      } else {
        showMsg(res.message);
      }
    } else if (selectedMethod === 'question') {
      setStep(2);
    }
    setLoading(false);
  };

  // PASO 3: Guardar la nueva contraseña
  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    const methodType = (method === 'sms' || method === 'call') ? 'otp' : method;
    
    const res = await resetPassword(email, methodType, authValue, newPassword);
    if (res.success) {
      alert("Contraseña actualizada correctamente.");
      navigate('/');
    } else {
      showMsg(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: '500px' }}>
        <h1>Recuperar Contraseña</h1>
        {message.text && (
          <div className="login-error" style={message.type === 'success' ? { backgroundColor: '#ccffcc', color: '#006600' } : {}}>
            {message.text}
          </div>
        )}

        {/* PASO 1: INGRESAR CORREO Y ELEGIR MÉTODO */}
        {step === 1 && (
          <div>
            <div className="form-group">
              <label className="form-label">Correo asociado a tu cuenta</label>
              <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
            </div>
            
            <p style={{ marginTop: '20px', marginBottom: '10px', fontSize: '14px', color: '#666' }}>Elige un método de recuperación:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="btn btn-secondary" disabled={loading} onClick={() => handleMethodSelect('email')}>1. Enviar enlace al Correo</button>
              <button className="btn btn-secondary" disabled={loading} onClick={() => handleMethodSelect('question')}>2. Responder Pregunta Secreta</button>
              <button className="btn btn-secondary" disabled={loading} onClick={() => handleMethodSelect('sms')}>3. Enviar SMS (Simulado)</button>
              <button className="btn btn-secondary" disabled={loading} onClick={() => handleMethodSelect('call')}>4. Recibir Llamada (Simulado)</button>
            </div>
          </div>
        )}

        {/* PASO 2: VALIDAR OTP O PREGUNTA */}
        {step === 2 && (
          <form onSubmit={() => setStep(3)}>
            <div className="form-group">
              <label className="form-label">
                {method === 'question' ? 'Pregunta: ¿Cuál es el nombre de tu primera mascota?' : 'Ingresa el código de 6 dígitos'}
              </label>
              <input 
                className="form-input" 
                type="text" 
                value={authValue} 
                onChange={(e) => setAuthValue(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Validar y Continuar</button>
          </form>
        )}

        {/* PASO 3: NUEVA CONTRASEÑA */}
        {step === 3 && (
          <form onSubmit={handleReset}>
            <div className="form-group">
              <label className="form-label">Escribe tu nueva contraseña</label>
              <input 
                className="form-input" 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Guardando...' : 'Guardar Nueva Contraseña'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button onClick={() => navigate('/')} className="btn-ghost">Volver al Inicio de Sesión</button>
        </div>
      </div>
    </div>
  );
}

export default RecuperarPassword;