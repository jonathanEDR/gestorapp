// src/components/Header.js
import React from 'react';

const Header = () => {
  return (
    <header className="bg-white shadow-md py-4 px-6 flex justify-between items-center border-b border-gray-200">
      <div className="relative w-64">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <i className="fas fa-search text-gray-400"></i>
        </div>
        <input type="text" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5" placeholder="Buscar..." />
      </div>
      <div className="flex items-center space-x-3">
        <button className="relative bg-indigo-100 text-indigo-500 p-2 rounded-full hover:bg-indigo-200 transition duration-150 ease-in-out">
          <i className="fas fa-bell"></i>
        </button>
        <div className="flex items-center">
          <img src="https://via.placeholder.com/40" alt="Perfil" className="w-8 h-8 rounded-full mr-2" />
          <span className="text-gray-700 font-semibold">Usuario</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
