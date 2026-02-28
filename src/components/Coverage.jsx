import React from 'react';
import { MapPin } from 'lucide-react';

const destinations = [
  'Temuco y alrededores',
  'Villarrica y Pucón',
  'Termas de Huife y Geométricas',
  'Costa del Pacífico',
  'Lagos Villarrica y Caburgua',
];

const Coverage = () => (
  <section className="py-20 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-emerald-900 mb-4">
          Cobertura Regional y nacional
        </h2>
        <p className="text-xl text-emerald-700 max-w-2xl mx-auto">
          Operamos en toda la región de la Araucanía y Chile entero
        </p>
      </div>

      <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-8 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-bold text-emerald-900 mb-6">Destinos principales:</h3>
            <ul className="space-y-3 text-emerald-700">
              {destinations.map((destination) => (
                <li key={destination} className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{destination}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <img
              src="/nieve.jpg"
              alt="Paisaje de la Araucanía"
              className="w-full h-64 object-cover rounded-xl shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default Coverage;