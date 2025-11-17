import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    // No renderizar nada mientras se verifica la sesión para evitar parpadeos
    // en la transición de la página de login a la privada.
    return null;
  }

  if (!user) {
    // Redirigir a la página de login si no hay usuario.
    // 'replace' evita que el usuario pueda volver a la página anterior con el botón de retroceso.
    return <Navigate to="/login" replace />;
  }

  // Si el usuario está autenticado, renderizar el contenido protegido.
  return children;
};

export default PrivateRoute;