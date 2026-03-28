import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import HostalPublico from './components/HostalPublico';
import FormularioReserva from './components/FormularioReserva';
import Confirmacion from './components/Confirmacion';
import LoginAdmin from './components/LoginAdmin';
import AdminDashboard from './components/AdminDashboard';

const App = () => (
  <BrowserRouter>
    <Routes>
      {/* Rutas estáticas primero — evitan que /:slug las capture */}
      <Route path="/"      element={<Home />} />
      <Route path="/login" element={<LoginAdmin />} />

      {/* Rutas dinámicas por slug */}
      <Route path="/:slug"                         element={<HostalPublico />} />
      <Route path="/:slug/reservar/:habitacion_id" element={<FormularioReserva />} />
      <Route path="/:slug/confirmacion"            element={<Confirmacion />} />
      <Route path="/:slug/admin"                   element={<AdminDashboard />} />
    </Routes>
  </BrowserRouter>
);

export default App;
