import { useEffect, useRef, useState } from "react";
import UserLayout from "../components/UserLayout";
import Carousel from "../components/Carousel";
import { createScrollAnimationObserver, handleParallax, magneticEffect } from "../utils/helpers";
import { obtenerDatosPerfil } from "../services/userService";

export default function UsuarioDashboard() {
  const [showDetails, setShowDetails] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const parallaxRef = useRef(null);
  // Mantenemos esto como array
  const cardsRef = useRef([]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const data = await obtenerDatosPerfil();
        setUserData(data);
      } catch (err) {
        console.error("Error cargando perfil:", err);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);

  // 2. INICIALIZAR ANIMACIONES (Aquí estaba el error)
  useEffect(() => {
    if (loading) return;

    const observer = createScrollAnimationObserver();
    
    // USAMOS EL OPERADOR ?. Y VALIDAMOS SI ES ARRAY
    if (cardsRef.current && Array.isArray(cardsRef.current)) {
      const validCards = cardsRef.current.filter(card => card !== null);
      validCards.forEach(card => observer.observe(card));
    }
    
    return () => observer.disconnect();
  }, [loading]);

  // Funciones de efectos (Parallax/Magnetic)
  const onMouseMoveParallax = (e) => {
    const movement = handleParallax(e, parallaxRef.current, 0.03);
    if (movement && parallaxRef.current) {
      parallaxRef.current.style.transform = `translate(${movement.x}px, ${movement.y}px)`;
    }
  };

  const onMouseLeaveParallax = () => {
    if (parallaxRef.current) parallaxRef.current.style.transform = 'translate(0px, 0px)';
  };

  const onMouseMoveMagnetic = (e) => {
    const { x, y } = magneticEffect(e, e.currentTarget, 0.4);
    e.currentTarget.style.transform = `translate(${x}px, ${y}px)`;
  };

  const onMouseLeaveMagnetic = (e) => {
    e.currentTarget.style.transform = 'translate(0px, 0px)';
  };

  const slides = [
    <div key="1" style={{ padding: '40px', textAlign: 'center', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', borderRadius: '12px', color: 'white' }}>
      <h2>🔥 Bienvenido</h2>
      <p>Hola {userData?.nombre || 'Usuario'}</p>
    </div>
  ];

  if (loading) return <UserLayout><p style={{color:'white'}}>Cargando...</p></UserLayout>;

  return (
    <UserLayout>
      {/* CORRECCIÓN CRÍTICA: Los refs deben llevar índice,, etc. */}
      
      <div className="page-header animate-on-scroll stagger-1" ref={el => (cardsRef.current = el)}>
        <h1>Bienvenido, {userData?.nombre || 'Usuario'}</h1>
        <p>Estatus: <b>{userData?.rol || 'Miembro'}</b></p>
      </div>

      <div className="animate-on-scroll stagger-2" ref={el => (cardsRef.current = el)} style={{ marginBottom: '40px' }}>
        <Carousel items={slides} autoPlay={true} interval={5000} />
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        <div 
          className="card animate-on-scroll stagger-3" 
          ref={el => (cardsRef.current = el)}
          style={{ flex: 1, minWidth: '300px' }}
          onMouseMove={onMouseMoveParallax}
          onMouseLeave={onMouseLeaveParallax}
        >
          <div className="card-header"><div className="card-title">Membresía</div></div>
          <div className="parallax-element" ref={parallaxRef} style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
            <h2 style={{ color: userData?.correo_verificado == 1 ? '#10b981' : '#ef4444' }}>
              {userData?.correo_verificado == 1 ? 'ACTIVA' : 'PENDIENTE'}
            </h2>
            <p>Vence: {userData?.fecha_vencimiento || 'N/A'}</p>
          </div>
        </div>

        <div className="card animate-on-scroll stagger-4" ref={el => (cardsRef.current = el)} style={{ flex: 1, minWidth: '300px' }}>
          <div className="card-header">
            <div className="card-title">Rutina</div>
            <button className="btn btn-sm btn-secondary" onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? "Cerrar" : "Ver"}
            </button>
          </div>
          <div className={`fade-transition ${!showDetails ? 'hidden' : ''}`}>
             <p>Sentadilla Libre - 4x10</p>
          </div>
        </div>

      </div>
    </UserLayout>
  );
}