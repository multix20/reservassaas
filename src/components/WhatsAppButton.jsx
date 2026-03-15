import React from 'react';
import { MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '+56951569704';
const WHATSAPP_MESSAGE = 'Hola, vi que no hay disponibilidad en marzo. ¿Puedo reservar desde abril?';

const WhatsAppButton = () => (
  <a
    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
    className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-400 text-white p-4
               rounded-full shadow-lg hover:shadow-xl transition-all duration-300
               hover:scale-110 z-50"
    aria-label="Contactar por WhatsApp"
  >
    <MessageCircle size={24} />
  </a>
);

export default WhatsAppButton;