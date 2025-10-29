import React from 'react';
import { ConfigProvider } from 'antd';
import { Routes, Route } from 'react-router-dom';

import esES from 'antd/locale/es_ES';
import Layout from './components/Layout';

import DevicesPage from './pages/DevicesPage.tsx';
import TestPage from './pages/TestPage.tsx';

import './App.css';

// Páginas de ejemplo
const HomePage: React.FC = () => (
  <div>
    <h2>Página de Inicio</h2>
    <p>Bienvenido a la aplicación</p>
  </div>
);
const ProjectsPage: React.FC = () => (
  <div>
    <h2>Proyectos</h2>
    <p>Gestiona tus proyectos</p>
  </div>
);
const MyProjectsPage: React.FC = () => (
  <div>
    <h2>Mis Proyectos</h2>
    <p>Tus proyectos personales</p>
  </div>
);
const SharedProjectsPage: React.FC = () => (
  <div>
    <h2>Proyectos Compartidos</h2>
    <p>Proyectos compartidos contigo</p>
  </div>
);
const DocumentsPage: React.FC = () => (
  <div>
    <h2>Documentos</h2>
    <p>Todos tus documentos</p>
  </div>
);
const ReportsPage: React.FC = () => (
  <div>
    <h2>Reportes</h2>
    <p>Centro de reportes</p>
  </div>
);
const SalesReportsPage: React.FC = () => (
  <div>
    <h2>Reportes de Ventas</h2>
    <p>Analiza tus ventas</p>
  </div>
);
const AnalyticsPage: React.FC = () => (
  <div>
    <h2>Análisis</h2>
    <p>Métricas y análisis</p>
  </div>
);
const ExportPage: React.FC = () => (
  <div>
    <h2>Exportar</h2>
    <p>Exporta tus reportes</p>
  </div>
);
const TeamPage: React.FC = () => (
  <div>
    <h2>Equipo</h2>
    <p>Gestiona tu equipo</p>
  </div>
);
const ProfilePage: React.FC = () => (
  <div>
    <h2>Perfil</h2>
    <p>Tu información personal</p>
  </div>
);
const SettingsPage: React.FC = () => (
  <div>
    <h2>Configuración</h2>
    <p>Ajustes de la aplicación</p>
  </div>
);

const App: React.FC = () => {
  return (
    <ConfigProvider locale={esES}>
      <Layout>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/devices' element={<DevicesPage />} />
          <Route path='/signals' element={<ProjectsPage />} />
          <Route path='/signals/test' element={<TestPage />} />
          <Route path='/signals/mine' element={<MyProjectsPage />} />
          <Route path='/signals/shared' element={<SharedProjectsPage />} />
          <Route path='/documents' element={<DocumentsPage />} />
          <Route path='/reports' element={<ReportsPage />} />
          <Route path='/reports/sales' element={<SalesReportsPage />} />
          <Route path='/reports/analytics' element={<AnalyticsPage />} />
          <Route path='/reports/export' element={<ExportPage />} />
          <Route path='/team' element={<TeamPage />} />
          <Route path='/profile' element={<ProfilePage />} />
          <Route path='/settings' element={<SettingsPage />} />
        </Routes>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
