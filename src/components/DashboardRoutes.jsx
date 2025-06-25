// Lazy loading de componentes para mejorar rendimiento
import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy loading de componentes
const Caja = lazy(() => import('./Caja'));
const ProductoList = lazy(() => import('./ProductoList'));
const VentaList = lazy(() => import('./VentaList'));
const CobroList = lazy(() => import('./CobroList'));
const ColaboradorList = lazy(() => import('./ColaboradorList'));
const GestionPersonal = lazy(() => import('./GestionPersonal'));
const Reportes = lazy(() => import('./Reportes'));
const GastoList = lazy(() => import('./GastoList'));
const PagosRealizados = lazy(() => import('./PagosRealizados'));

// Componente de loading
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-gray-600">Cargando...</span>
  </div>
);

// Error Boundary para manejar errores de carga
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error cargando componente:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Error al cargar el componente
            </h2>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Rutas con lazy loading
export const DashboardRoutes = () => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner />}>      <Routes>
        <Route path="caja" element={<Caja />} />
        <Route path="productos" element={<ProductoList />} />
        <Route path="ventas" element={<VentaList />} />
        <Route path="cobros" element={<CobroList />} />
        <Route path="colaboradores" element={<ColaboradorList />} />
        <Route path="gestion-personal" element={<GestionPersonal />} />
        <Route path="pagos-realizados" element={<PagosRealizados />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="gastos" element={<GastoList />} />
        <Route path="" element={<Caja />} />
      </Routes>
    </Suspense>
  </ErrorBoundary>
);
