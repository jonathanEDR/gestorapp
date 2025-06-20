import React, { useState } from 'react';
import ProductoList from './ProductoList';
import VentaList from './VentaList';
import CobroList from './CobroList';
import ColaboradorList from './ColaboradorList';
import GestionPersonal from './GestionPersonal';
import Reportes from './Reportes';
import GastoList from './GastoList';  
import LogoutButton from './LogouButton';
import { useUser } from '@clerk/clerk-react';

function Dashboard() {
  const { user } = useUser();
  const [activeSection, setActiveSection] = useState('reportes');
  const [isSidebarVisible, setSidebarVisible] = useState(true);

  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  const toggleSidebar = () => {
    setSidebarVisible(!isSidebarVisible);
  };

  const firstName = user ? user.firstName : 'Usuario';

  const menuItems = [
    {
      id: 'reportes',
      title: 'Análisis de Gestión',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'productos',
      title: 'Control de Inventario',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    {
      id: 'ventas',
      title: 'Control de Ventas',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      id: 'cobros',
      title: 'Control de Cobros',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )
    },    {
      id: 'colaboradores',
      title: 'Colaboradores',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.121M17 20H7m10 0v-2c0-5-4-8-8-8s-8 3-8 8v2m12-8a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      id: 'gestionPersonal',
      title: 'Gestión Personal',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      id: 'gastos',
      title: 'Control de Gastos',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Header Mejorado */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Logo Prime */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-slate-700 to-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                    Prime
                  </h1>
                  <p className="text-xs text-slate-500">Management System</p>
                </div>
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-700">¡Bienvenido!</p>
                <p className="text-lg font-semibold text-slate-900">{firstName}</p>
              </div>
                  <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-semibold">
                  {firstName.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex relative">
        {/* Sidebar Toggle Button - Mejorado */}
        <button
          onClick={toggleSidebar}
          className={`fixed top-1/2 -translate-y-1/2 z-40 w-6 h-14 bg-white shadow-lg flex items-center justify-center transition-all duration-300 hover:shadow-xl group ${
            isSidebarVisible ? 'left-72' : 'left-0'
          }`}
          style={{ 
            borderRadius: '0 12px 12px 0',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          <div className={`text-slate-600 group-hover:text-slate-800 transition-all duration-300 ${isSidebarVisible ? '-rotate-180' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          </div>
        </button>
        
        {/* Sidebar Mejorado */}
        <aside 
          className={`fixed left-0 top-20 h-[calc(100vh-5rem)] bg-white/95 backdrop-blur-sm border-r border-slate-200 shadow-xl transition-all duration-300 ease-in-out z-30 overflow-hidden ${
            isSidebarVisible ? 'w-72' : 'w-0'
          }`}
        >
          <div className={`flex flex-col h-full pt-6 ${
            isSidebarVisible ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-300`}>

            {/* Navigation Menu */}
            <nav className="flex-grow px-4 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-xl transition-all duration-200 group ${
                    activeSection === item.id 
                      ? 'bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-lg transform scale-[1.02]' 
                      : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900 hover:shadow-md'
                  }`}
                >
                  <div className={`transition-transform duration-200 ${
                    activeSection === item.id ? 'scale-110' : 'group-hover:scale-105'
                  }`}>
                    {item.icon}
                  </div>
                  <span className="font-medium whitespace-nowrap">{item.title}</span>
                  {activeSection === item.id && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full opacity-75"></div>
                  )}
                </button>
              ))}
            </nav>
            
            {/* Logout Button */}
            <div className="px-4 pb-6 pt-4 border-t border-slate-200 mt-auto">
              <LogoutButton className="w-full flex items-center space-x-3 px-4 py-3 text-left rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group hover:shadow-md">
                <svg className="w-5 h-5 group-hover:scale-105 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-medium">Cerrar sesión</span>
              </LogoutButton>
            </div>
          </div>
        </aside>

        {/* Main Content Mejorado */}
        <main 
          className={`flex-1 transition-all duration-300 ease-in-out ${
            isSidebarVisible ? 'ml-72' : 'ml-0'
          }`}
        >
          <div className="p-6">
            {/* Breadcrumb */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <span>Prime</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-slate-900 font-medium">
                  {menuItems.find(item => item.id === activeSection)?.title}
                </span>
              </div>
            </div>

            {/* Content Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="p-8 min-h-[calc(100vh-16rem)]">                {activeSection === 'productos' && <ProductoList />}
                {activeSection === 'ventas' && <VentaList />}
                {activeSection === 'cobros' && <CobroList />}
                {activeSection === 'colaboradores' && <ColaboradorList />}
                {activeSection === 'gestionPersonal' && <GestionPersonal />}
                {activeSection === 'reportes' && <Reportes />}
                {activeSection === 'gastos' && <GastoList />}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;