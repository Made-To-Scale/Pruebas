import React from 'react';
import { useAuth } from '../providers/AuthProvider';

const Topbar: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="flex items-center justify-end h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 shadow-sm">
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-slate-600 hidden sm:block truncate" title={user?.email ?? 'Usuario'}>
          {user?.email}
        </span>
        <button
          onClick={signOut}
          className="px-4 py-2 bg-slate-100 text-slate-800 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors duration-200"
        >
          Salir
        </button>
      </div>
    </header>
  );
};

export default Topbar;
