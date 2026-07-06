import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Home from './components/Home';
import HostalPublico from './components/HostalPublico';
import FormularioReserva from './components/FormularioReserva';
import Confirmacion from './components/Confirmacion';
import LoginAdmin from './components/LoginAdmin';
import AdminDashboard from './components/AdminDashboard';
import VitrinaHostelia from './components/VitrinaHostelia';

/*
 * Modo de presentación según ruta:
 *  - "/" (landing/vitrina)  → web normal, pantalla completa
 *  - "/:slug/..." (la app)  → marco tipo teléfono en escritorio (clase .modo-app en <body>)
 */
const ModoPresentacion = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    // Páginas web a pantalla completa: vitrina Hostelia y landing del hostal
    const esWeb = pathname === '/' || pathname === '/hostelia';
    document.body.classList.toggle('modo-app', !esWeb);
  }, [pathname]);
  return null;
};

const App = () => (
  <BrowserRouter>
    <ModoPresentacion />
    <Routes>
      {/* Rutas estáticas primero — evitan que /:slug las capture */}
      <Route path="/"         element={<Home />} />
      <Route path="/hostelia" element={<VitrinaHostelia />} />
      <Route path="/:slug/admin/login" element={<LoginAdmin />} />

      {/* Rutas dinámicas por slug */}
      <Route path="/:slug"                         element={<HostalPublico />} />
      <Route path="/:slug/reservar/:habitacion_id" element={<FormularioReserva />} />
      <Route path="/:slug/confirmacion"            element={<Confirmacion />} />
      <Route path="/:slug/admin"                   element={<AdminDashboard />} />
    </Routes>
  </BrowserRouter>
);

export default App;
