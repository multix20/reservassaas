import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import Advantages from './components/Advantages';
import VideoGallery from './components/VideoGallery';
import Coverage from './components/Coverage';
import Contact from './components/Contact';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import Reservas from './components/Reservas';
import ReservationManager from './components/ReservationManager';
import SocioDashboard from './components/SocioDashboard';
import HostalPublico from './components/HostalPublico';
import FormularioReserva from './components/FormularioReserva';
import Confirmacion from './components/Confirmacion';
import LoginAdmin from './components/LoginAdmin';
import AdminDashboard from './components/AdminDashboard';

// ─── Landing page pública ─────────────────────────────────────
const LandingPage = () => (
  <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-green-50">
    <Header />
    <main style={{ paddingTop: '64px' }}>
      <Reservas />
      <Hero />
      <Services />
      <Advantages />
      <VideoGallery />
      <Coverage />
      <Contact />
      <Footer />
    </main>
    <WhatsAppButton />
  </div>
);

// ─── App con rutas ────────────────────────────────────────────
const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/"      element={<LandingPage />} />
      <Route path="/admin" element={<ReservationManager />} />
      <Route path="/socio" element={<SocioDashboard />} />
      <Route path="/:tenant_id" element={<HostalPublico />} />
      <Route path="/:tenant_id/reservar/:habitacion_id" element={<FormularioReserva />} />
      <Route path="/:tenant_id/confirmacion" element={<Confirmacion />} />
      <Route path="/admin/login" element={<LoginAdmin />} />
      <Route path="/:tenant_id/admin" element={<AdminDashboard />} />
    </Routes>
  </BrowserRouter>
);

export default App;