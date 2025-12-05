
import React from 'react';
import { NavLink } from 'react-router-dom';
import { FolderIcon, HomeIcon } from './Icons';

const Sidebar: React.FC = () => {
  const navLinkClasses = ({ isActive }: { isActive: boolean }): string =>
    `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
      isActive
        ? 'bg-mts-navyLight text-mts-green shadow-sm'
        : 'text-slate-400 hover:bg-mts-navyLight hover:text-white'
    }`;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-mts-navy border-r border-slate-800">
      <div className="flex items-center justify-center h-16 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-wider">MTS PANEL</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        <NavLink to="/proyectos" className={navLinkClasses}>
          <FolderIcon className="w-5 h-5 mr-3" />
          Proyectos
        </NavLink>
      </nav>
      <div className="px-4 py-4 border-t border-slate-800">
         <p className="text-xs text-slate-500">© 2024 MTS Inc.</p>
      </div>
    </aside>
  );
};

export default Sidebar;
