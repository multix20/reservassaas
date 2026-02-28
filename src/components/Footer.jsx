import React from 'react';

const Footer = () => (
  <footer className="bg-emerald-950 text-emerald-100 py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">AV</span>
          </div>
          <span className="text-lg font-semibold">Araucania Viajes</span>
        </div>
        <p className="text-emerald-400 text-sm text-center md:text-right">
          © 2026 Araucania Viajes. Conectando la Araucanía con comodidad y seguridad.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;