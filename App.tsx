import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailLayout from './pages/ProjectDetailLayout';
import ProjectBriefPage from './pages/ProjectBriefPage';
import ProjectAvatarsPage from './pages/ProjectAvatarsPage';
import ProjectResultsPage from './pages/ProjectResultsPage';
import AvatarMasterResultPage from './pages/AvatarMasterResultPage';
import ProjectOverviewPage from './pages/ProjectOverviewPage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';
import PrivateRoute from './components/PrivateRoute';
import LevelDetailPage from './pages/LevelDetailPage';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/proyectos" replace />} />
          <Route path="proyectos" element={<ProjectsPage />} />
          <Route path="proyectos/:id" element={<ProjectDetailLayout />}>
            <Route index element={<Navigate to="detalle" replace />} />
            <Route path="detalle" element={<ProjectOverviewPage />} />
            <Route path="brief" element={<ProjectBriefPage />} />
            <Route path="avatares" element={<ProjectAvatarsPage />} />
            <Route path="resultados" element={<ProjectResultsPage />} />
            <Route path="resultados/avatar/:avatarId" element={<AvatarMasterResultPage />} />
            <Route path="resultados/avatar/:avatarId/nivel/:level" element={<LevelDetailPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;