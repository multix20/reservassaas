import React, { useState } from 'react';
import { Phone, MapPin } from 'lucide-react';

const WHATSAPP_NUMBER = '+56951569704';

const Contact = () => {
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Dispara conversión en Google Ads
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', {
        send_to: 'AW-17987998194/_9QgCLrGj4McEPKjrIFD',
        value: 1.0,
        currency: 'CLP',
      });
    }

    setEnviado(true);
  };

  return (
    <section id="contacto" className="py-20 bg-gradient-to-br from-emerald-900 to-green-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Contáctanos</h2>
          <p className="text-xl text-emerald-100 max-w-2xl mx-auto">
            Estamos listos para hacer tu viaje inolvidable
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact info */}
          <div className="space-y-8">
            <div className="flex items-center space-x-4">
              <div className="bg-emerald-600 p-3 rounded-full">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">WhatsApp</h3>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} className="text-emerald-200 hover:text-white transition-colors">
                  +56 9 5156 9704
                </a>
                <a href="https://wa.me/56997035692" className="block text-emerald-200 hover:text-white transition-colors">
                  +56 9 9703 5692
                </a>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-emerald-600 p-3 rounded-full">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Cobertura</h3>
                <p className="text-emerald-200">Región de la Araucanía, Chile</p>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl">
            <h3 className="text-2xl font-bold mb-6">Solicita tu cotización</h3>

            {enviado ? (
              <div className="text-center py-8">
                <p className="text-2xl font-bold text-emerald-300">¡Mensaje enviado! ✅</p>
                <p className="text-emerald-100 mt-2">Nos pondremos en contacto contigo pronto.</p>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <input
                  type="email"
                  placeholder="Tu email"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <input
                  type="tel"
                  placeholder="Tu teléfono"
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <textarea
                  placeholder="Cuéntanos sobre tu viaje"
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                />
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Enviar mensaje
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;