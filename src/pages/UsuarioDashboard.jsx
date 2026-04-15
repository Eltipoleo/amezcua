import { useEffect, useRef, useState } from "react";
import UserLayout from "../components/UserLayout";
import Carousel from "../components/Carousel";
import { createScrollAnimationObserver, handleParallax, magneticEffect } from "../utils/helpers";

export default function UsuarioDashboard() {
  const [showDetails, setShowDetails] = useState(false);
  
  const parallaxRef = useRef(null);
  const cardsRef = useRef([]);

  // 1. Inicializar animaciones de scroll
  useEffect(() => {
    const observer = createScrollAnimationObserver();
    if (cardsRef.current && Array.isArray(cardsRef.current)) {
      cardsRef.current.forEach(card => {
        if (card) observer.observe(card);
      });
    }
    return () => observer.disconnect();
  }, []);

  // 2. Evento Parallax
  const onMouseMoveParallax = (e) => {
    const movement = handleParallax(e, parallaxRef.current, 0.03); // Intensidad sutil
    if (movement && parallaxRef.current) {
      parallaxRef.current.style.transform = `translate(${movement.x}px, ${movement.y}px)`;
    }
  };

  const onMouseLeaveParallax = () => {
    if (parallaxRef.current) {
      parallaxRef.current.style.transform = 'translate(0px, 0px)';
    }
  };

  // 3. Efecto Magnético en Botones
  const onMouseMoveMagnetic = (e) => {
    const btn = e.currentTarget;
    const { x, y } = magneticEffect(e, btn, 0.4);
    btn.style.transform = `translate(${x}px, ${y}px)`;
  };

  const onMouseLeaveMagnetic = (e) => {
    e.currentTarget.style.transform = 'translate(0px, 0px)';
  };

  // 4. Slides para el Carrusel
  const slides = [
    <div key="1" style={{ padding: '40px', textAlign: 'center', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', borderRadius: '12px', color: 'white' }}>
      <h2>🔥 Promoción de Verano</h2>
      <p>Invita a un amigo y obtén 50% de descuento en tu mensualidad.</p>
    </div>,
    <div key="2" style={{ padding: '40px', textAlign: 'center', background: 'linear-gradient(135deg, #16a34a, #15803d)', borderRadius: '12px', color: 'white' }}>
      <h2>🧘‍♀️ Nuevas Clases de Yoga</h2>
      <p>Todos los martes y jueves a las 7:00 AM.</p>
    </div>,
    <div key="3" style={{ padding: '40px', textAlign: 'center', background: 'linear-gradient(135deg, #f59e0b, #b45309)', borderRadius: '12px', color: 'white' }}>
      <h2>🏆 Reto 30 Días</h2>
      <p>Inscríbete en la recepción para el reto de pérdida de grasa.</p>
    </div>
  ];

  return (
    <UserLayout>
      <div className="page-header animate-on-scroll stagger-1" ref={el => cardsRef.current = el}>
        <h1>Bienvenido a tu Panel</h1>
        <p>Revisa tus métricas, anuncios y progreso.</p>
      </div>

      {/* CARRUSEL AVANZADO */}
      <div className="animate-on-scroll stagger-2" ref={el => cardsRef.current = el} style={{ marginBottom: '40px' }}>
        <Carousel items={slides} autoPlay={true} interval={5000} />
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* TARJETA CON PARALLAX Y BOTÓN MAGNÉTICO */}
        <div 
          className="card animate-on-scroll stagger-3 hover-glow" 
          ref={el => cardsRef.current = el}
          style={{ flex: 1, minWidth: '300px', overflow: 'hidden' }}
          onMouseMove={onMouseMoveParallax}
          onMouseLeave={onMouseLeaveParallax}
        >
          <div className="card-header">
            <div className="card-title">Membresía</div>
          </div>
          
          {/* Elemento que se mueve con el parallax */}
          <div className="parallax-element" ref={parallaxRef} style={{ padding: '20px', background: 'var(--color-bg-tertiary)', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2rem', color: 'var(--color-success)' }}>ACTIVA</h2>
            <p>Vence en 15 días</p>
          </div>

          <button 
            className="btn btn-primary magnetic-btn" 
            style={{ width: '100%' }}
            onMouseMove={onMouseMoveMagnetic}
            onMouseLeave={onMouseLeaveMagnetic}
          >
            Renovar Membresía
          </button>
        </div>

        {/* TARJETA CON MOSTRAR/OCULTAR SUAVE (Sin display:none) */}
        <div className="card animate-on-scroll stagger-4" ref={el => cardsRef.current = el} style={{ flex: 1, minWidth: '300px' }}>
          <div className="card-header">
            <div className="card-title">Rutina de Hoy</div>
            <button 
              className="btn btn-sm btn-secondary" 
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? "Ocultar" : "Ver detalles"}
            </button>
          </div>
          
          <h3>Día de Pierna y Glúteo</h3>
          
          {/* El contenedor usa las clases de transición de index.css */}
          <div className={`fade-transition ${!showDetails ? 'hidden' : ''}`} style={{ marginTop: '15px' }}>
            <ul className="exercise-list">
              <li className="exercise-item hover-lift">
                <div className="exercise-info">
                  <span className="exercise-name">Sentadilla Libre</span>
                  <span className="exercise-details">4 series x 10 reps</span>
                </div>
              </li>
              <li className="exercise-item hover-lift">
                <div className="exercise-info">
                  <span className="exercise-name">Prensa Atlética</span>
                  <span className="exercise-details">4 series x 12 reps</span>
                </div>
              </li>
            </ul>
          </div>

        </div>

      </div>
    </UserLayout>
  );
}