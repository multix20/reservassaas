import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1679672033772-fa8a6cb17d04?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Descubre la Araucanía',
    subtitle: 'Lagos, volcanes y naturaleza sin igual',
  },
  {
    image: 'https://images.unsplash.com/photo-1679672033676-706decf553ab?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Volcanes y Montañas',
    subtitle: 'Vive la majestuosidad del Villarrica y el Llaima',
  },
  {
    image: 'https://plus.unsplash.com/premium_photo-1738099067629-e0931981fe45?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Termas y Relax',
    subtitle: 'Aguas termales',
  },
  {
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Villarrica%2C_Lago_Villarrica%2C_2019_%2802%29.jpg/960px-Villarrica%2C_Lago_Villarrica%2C_2019_%2802%29.jpg',
    title: 'Lagos Cristalinos',
    subtitle: 'Caburgua, Villarrica y sus orillas únicas',
  },
];

const WHATSAPP_NUMBER = '+56951569704';
const WHATSAPP_MESSAGE = 'Hola, me interesa conocer más sobre sus servicios de transporte';

const Hero = () => {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = useCallback((index) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent((index + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), 700);
  }, [isTransitioning]);

  const prev = useCallback(() => {
    goTo(current - 1);
  }, [current, goTo]);

  // Auto-advance usando solo setCurrent para evitar dependencia en "current"
  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setCurrent((prev) => (prev + 1) % slides.length);
      setTimeout(() => setIsTransitioning(false), 700);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const next = useCallback(() => {
    goTo(current + 1);
  }, [current, goTo]);

  return (
    <section id="inicio" className="relative h-screen min-h-[600px] overflow-hidden">

      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          style={{ transition: 'opacity 0.7s ease' }}
          className={`absolute inset-0 ${index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
            loading={index === 0 ? 'eager' : 'lazy'}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-4 gap-2">
        <span className="text-emerald-300 text-sm font-semibold tracking-widest uppercase mb-3">
          Región de la Araucanía · Chile
        </span>

        <h1
          key={current}
          className="text-5xl md:text-7xl font-extrabold text-white mb-4"
        >
          {slides[current].title}
        </h1>

        <p
          key={`sub-${current}`}
          className="text-xl md:text-2xl text-emerald-100 mb-10 max-w-2xl drop-shadow"
        >
          {slides[current].subtitle}
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
            className="inline-flex items-center gap-2 bg-green-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-2xl"
          >
            <MessageCircle size={22} />
            Cotizar por WhatsApp
          </a>
          <a
            href="#servicios"
            className="border-2 border-white/80 text-white px-8 py-4 rounded-xl font-bold text-lg"
          >
            Ver Servicios
          </a>
        </div>
      </div>

      {/* Flecha izquierda */}
      <button
        onClick={prev}
        aria-label="Anterior"
        className="absolute left-4 top-[53%] -translate-y-1/2 z-30 bg-black/30 text-white p-3 rounded-full backdrop-blur-sm"
      >
        <ChevronLeft size={28} />
      </button>

      {/* Flecha derecha */}
      <button
        onClick={next}
        aria-label="Siguiente"
        className="absolute right-4 top-[53%] -translate-y-1/2 z-30 bg-black/30 text-white p-3 rounded-full backdrop-blur-sm"
      >
        <ChevronRight size={28} />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index)}
            aria-label={`Ir a slide ${index + 1}`}
            className={`rounded-full transition-all duration-300 ${index === current ? 'bg-emerald-400 w-8 h-3' : 'bg-white/50 w-3 h-3'}`}
          />
        ))}
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 right-8 z-30 hidden md:flex flex-col items-center gap-1 text-white/60 text-xs">
        <span>Scroll</span>
        <div className="w-px h-8 bg-white/40" />
      </div>

    </section>
  );
};

export default Hero;