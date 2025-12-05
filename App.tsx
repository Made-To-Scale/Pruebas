
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailLayout from './pages/ProjectDetailLayout';
import ProjectBriefPage from './pages/ProjectBriefPage';
import ProjectAvatarsPage from './pages/ProjectAvatarsPage';
import ProjectCompetitorsPage from './pages/ProjectCompetitorsPage';
import CompetitorDetailPage from './pages/CompetitorDetailPage';
import ProjectNarrativePage from './pages/ProjectNarrativePage';
import ProjectAdCreatorPage from './pages/ProjectAdCreatorPage';
import ProjectDashboardPage from './pages/ProjectDashboardPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import AvatarMasterResultPage from './pages/AvatarMasterResultPage';
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
            <Route path="detalle" element={<ProjectDetailPage />} />
            <Route path="dashboard" element={<ProjectDashboardPage />} />
            <Route path="brief" element={<ProjectBriefPage />} />
            <Route path="avatares" element={<ProjectAvatarsPage />} />
            <Route path="competencia" element={<ProjectCompetitorsPage />} />
            <Route path="competencia/:competitorId" element={<CompetitorDetailPage />} />
            <Route path="narrativa" element={<ProjectNarrativePage />} />
            <Route path="anuncios" element={<ProjectAdCreatorPage />} />
            <Route path="avatares/:avatarId/analysis" element={<AvatarMasterResultPage />} />
            <Route path="avatares/:avatarId/analysis/nivel/:level" element={<LevelDetailPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;