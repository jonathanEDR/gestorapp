import React, { useState } from 'react';
import ProductoList from './ProductoList';
import VentaList from './VentaList';
import CobroList from './CobroList';
import ColaboradorList from './ColaboradorList';
import Reportes from './Reportes';
import GastoList from './GastoList';  
import GestionPersonal from './GestionPersonal';
import LogoutButton from './LogouButton';  // Asegúrate de que la ruta sea correcta
import { useUser } from '@clerk/clerk-react';  // Importar el hook useUser de Clerk



function Dashboard() {
  const { user } = useUser();  // Obtener el usuario autenticado desde Clerk

  const [activeSection, setActiveSection] = useState('reportes');
  const [isSidebarVisible, setSidebarVisible] = useState(true);
  const [showChatbot, setShowChatbot] = useState(false);


  
  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  const toggleSidebar = () => {
    setSidebarVisible(!isSidebarVisible);
  };

  const toggleChatbot = () => {
    setShowChatbot(!showChatbot);
  };

  const firstName = user ? user.firstName : 'Usuario';  // Mostrar "Usuario" si no hay nombre


  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <h1 className="text-3xl font-bold text-gray-800 p-6">
                Welcome to your Dashboard, {firstName}!
        </h1>
      </header>

      {/* Main Layout */}
      <div className="flex">
        {/* Sidebar Toggle Button - Centered and Modern */}
        <button
          onClick={toggleSidebar}
          className={`fixed top-1/2 -translate-y-1/2 z-40 w-5 h-12 bg-white shadow-md flex items-center justify-center transition-all duration-300 ${
            isSidebarVisible ? 'left-64' : 'left-0'
          }`}
          style={{ 
            borderRadius: '0 20px 20px 0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className={`text-blue-500 transition-transform duration-300 ${isSidebarVisible ? '-rotate-180' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          </div>
        </button>
        
        <aside 
          className={`fixed left-0 top-24 h-[calc(100vh-6rem)] bg-white shadow-lg transition-all duration-300 ease-in-out z-30 overflow-hidden ${
            isSidebarVisible ? 'w-64' : 'w-0'
          }`}
        >
          <div className={`flex flex-col h-full pt-8 px-4 ${
            isSidebarVisible ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-300`}>
            {/* Menú principal */}
            <div className="space-y-2 flex-grow">
              <button 
                onClick={() => handleSectionChange('productos')}
                className={`w-full px-4 py-2 text-left rounded-lg transition-colors whitespace-nowrap ${
                  activeSection === 'productos' ? 'bg-blue-500 text-white' : 'hover:bg-blue-500 hover:text-white'
                }`}
              >
                Control de Inventario
              </button>
              <button 
                onClick={() => handleSectionChange('ventas')}
                className={`w-full px-4 py-2 text-left rounded-lg transition-colors ${
                  activeSection === 'ventas' ? 'bg-blue-500 text-white' : 'hover:bg-blue-500 hover:text-white'
                }`}
              >
                Control de Ventas 
              </button>
              <button 
                onClick={() => handleSectionChange('cobros')}
                className={`w-full px-4 py-2 text-left rounded-lg transition-colors ${
                  activeSection === 'cobros' ? 'bg-blue-500 text-white' : 'hover:bg-blue-500 hover:text-white'
                }`}
              >
                Control de Cobros
              </button>
              <button 
                onClick={() => handleSectionChange('colaboradores')}
                className={`w-full px-4 py-2 text-left rounded-lg transition-colors ${
                  activeSection === 'colaboradores' ? 'bg-blue-500 text-white' : 'hover:bg-blue-500 hover:text-white'
                }`}
              >
                Colaboradores
              </button>

              <button 
                onClick={() => handleSectionChange('gastos')}
                className={`w-full px-4 py-2 text-left rounded-lg transition-colors ${
                  activeSection === 'gastos' ? 'bg-blue-500 text-white' : 'hover:bg-blue-500 hover:text-white'
                }`}
              >
                Control de Gastos
              </button>

              <button 
                onClick={() => handleSectionChange('gestionPersonal')}
                className={`w-full px-4 py-2 text-left rounded-lg transition-colors ${
                  activeSection === 'gestionPersonal' ? 'bg-blue-500 text-white' : 'hover:bg-blue-500 hover:text-white'
                }`}
              >
                Gestión Personal
              </button>

              <button 
                onClick={() => handleSectionChange('reportes')}
                className={`w-full px-4 py-2 text-left rounded-lg transition-colors ${
                  activeSection === 'reportes' ? 'bg-blue-500 text-white' : 'hover:bg-blue-500 hover:text-white'
                }`}
              >
                Analisis de Gestion
              </button>
            </div>
            
            {/* Botón de cerrar sesión al final */}
            <div className="mt-auto mb-6 pt-4 border-t border-gray-200">
              <LogoutButton 
                className="w-full px-4 py-2 text-left rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                Cerrar sesión
              </LogoutButton>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main 
          className={`flex-1 transition-all duration-300 ease-in-out ${
            isSidebarVisible ? 'ml-64' : 'ml-0'
          }`}
        >
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-lg p-6 min-h-[calc(100vh-12rem)]">
              {activeSection === 'productos' && <ProductoList />}
              {activeSection === 'ventas' && <VentaList />}
              {activeSection === 'cobros' && <CobroList />}
              {activeSection === 'colaboradores' && <ColaboradorList />}
              {activeSection === 'reportes' && <Reportes />}
              {activeSection === 'gastos' && <GastoList />}
  {activeSection === 'gestionPersonal' && <GestionPersonal />}

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;