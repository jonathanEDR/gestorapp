// Componente de breadcrumbs dinámicos
import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const Breadcrumbs = () => {
  const location = useLocation();
    // Configuración de rutas y sus títulos
  const routeConfig = {
    'productos': 'Control de Inventario',
    'ventas': 'Control de Ventas',
    'cobros': 'Control de Cobros',
    'colaboradores': 'Colaboradores',
    'gestion-personal': 'Gestión Personal',
    'reportes': 'Análisis de Gestión',
    'gastos': 'Control de Gastos'
  };

  // Generar rutas desde la URL actual
  const pathSegments = location.pathname.split('/').filter(segment => segment);
  
  // Si estamos en la raíz, mostrar como reportes
  if (pathSegments.length === 0) {
    return (
      <nav className="mb-6" aria-label="Breadcrumb">
        <div className="flex items-center space-x-2 text-sm text-slate-600">
          <span>Prime</span>
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-900 font-medium">
            Análisis de Gestión
          </span>
        </div>
      </nav>
    );
  }

  // Construir breadcrumbs
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    const title = routeConfig[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === pathSegments.length - 1;
    
    return {
      path,
      title,
      isLast
    };
  });

  return (
    <nav className="mb-6" aria-label="Breadcrumb">
      <div className="flex items-center space-x-2 text-sm text-slate-600">
        <Link 
          to="/" 
          className="hover:text-slate-900 transition-colors duration-200"
        >
          Prime
        </Link>
        
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.path}>
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            
            {crumb.isLast ? (
              <span className="text-slate-900 font-medium">
                {crumb.title}
              </span>
            ) : (
              <Link 
                to={crumb.path}
                className="hover:text-slate-900 transition-colors duration-200"
              >
                {crumb.title}
              </Link>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
};

export default Breadcrumbs;
