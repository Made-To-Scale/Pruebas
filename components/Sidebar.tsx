
import React from 'react';
import { NavLink } from 'react-router-dom';
import { FolderIcon, HomeIcon } from './Icons';

const Sidebar: React.FC = () => {
  const navLinkClasses = ({ isActive }: { isActive: boolean }): string =>
    `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-slate-200 text-slate-900'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200">
      <div className="flex items-center justify-center h-16 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-800 tracking-wider">MTS PANEL</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        <NavLink to="/proyectos" className={navLinkClasses}>
          <FolderIcon className="w-5 h-5 mr-3" />
          Proyectos
        </NavLink>
      </nav>
      <div className="px-4 py-4 border-t border-slate-200">
         <p className="text-xs text-slate-400">© 2024 MTS Inc.</p>
      </div>
    </aside>
  );
};

export default Sidebar;
