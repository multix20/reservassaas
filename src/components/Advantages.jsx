import React from 'react';
import { Car, Users, Shield, Clock, Star, ThumbsUp, MapPin, HeartHandshake } from 'lucide-react';

const advantages = [
  {
    icon: Car,
    title: 'Flota Moderna',
    description: 'Vehículos de último modelo con mantenimiento riguroso y certificado.',
  },
  {
    icon: Users,
    title: 'Conductores Certificados',
    description: 'Profesionales con experiencia, licencias vigentes y capacitación continua.',
  },
  {
    icon: Clock,
    title: 'Puntualidad Garantizada',
    description: 'Respetamos tu tiempo. Llegamos antes para que tú llegues a tiempo.',
  },
  {
    icon: Shield,
    title: 'Viaje Seguro',
    description: 'Todos nuestros vehículos cuentan con seguro completo y revisión técnica al día.',
  },
  {
    icon: MapPin,
    title: 'Cobertura Regional',
    description: 'Cubrimos toda la Araucanía y destinos cercanos sin costo adicional por zona.',
  },
  {
    icon: HeartHandshake,
    title: 'Atención Personalizada',
    description: 'Adaptamos cada viaje a tus necesidades. Coordinamos todo por WhatsApp.',
  },
];



const Advantages = () => (
  <section id="ventajas" className="py-20 bg-gradient-to-br from-emerald-900 to-green-800 relative overflow-hidden">

    {/* Fondo decorativo */}
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
    </div>

    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="text-center mb-16">
        <span className="text-emerald-300 text-sm font-semibold tracking-widest uppercase mb-3 block">
          Nuestros diferenciales
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          ¿Por qué elegirnos?
        </h2>
        <p className="text-xl text-emerald-200 max-w-2xl mx-auto">
          Tu tranquilidad y comodidad son nuestra prioridad
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {advantages.map(({ icon: Icon, title, description }, index) => (
          <div
            key={index}
            className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-emerald-300/50 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="w-12 h-12 bg-emerald-500 group-hover:bg-emerald-400 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300">
              <Icon size={22} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-emerald-200 text-sm leading-relaxed">{description}</p>
          </div>
        ))}
      </div>

    </div>
  </section>
);

export default Advantages;