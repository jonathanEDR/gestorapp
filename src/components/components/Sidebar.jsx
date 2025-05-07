// src/components/Sidebar.js
import React, { useState } from 'react';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <aside className={`bg-gray-800 text-white w-64 py-4 px-3 space-y-4 sidebar ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed top-0 left-0 h-full z-20`}>
      <div className="flex items-center justify-between">
        <a href="#" className="text-xl font-semibold text-indigo-400">Admin Panel</a>
        <button onClick={toggleSidebar} className="text-gray-400 hover:text-white focus:outline-none md:hidden">
          <i className="fas fa-bars fa-lg"></i>
        </button>
      </div>
      <nav className="space-y-2">
        <a href="#inventario" className="flex items-center py-2 px-3 rounded-md hover:bg-gray-700 group transition duration-150 ease-in-out">
          <i className="fas fa-box-open mr-2 text-gray-400 group-hover:text-indigo-300"></i>
          <span className="group-hover:text-indigo-300">Inventario</span>
        </a>
        {/* Otros enlaces de navegación */}
      </nav>
    </aside>
  );
};

export default Sidebar;
