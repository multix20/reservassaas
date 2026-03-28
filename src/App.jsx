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
      <Route path="/"                                   element={<Home />} />
      <Route path="/admin/login"                        element={<LoginAdmin />} />
      <Route path="/:tenant_id"                         element={<HostalPublico />} />
      <Route path="/:tenant_id/reservar/:habitacion_id" element={<FormularioReserva />} />
      <Route path="/:tenant_id/confirmacion"            element={<Confirmacion />} />
      <Route path="/admin/:slug"                          element={<AdminDashboard />} />
    </Routes>
  </BrowserRouter>
);

export default App;