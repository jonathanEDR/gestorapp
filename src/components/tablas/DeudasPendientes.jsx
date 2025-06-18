import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api from '../../services/api';

const DeudasPendientes = () => {
  const { getToken } = useAuth();
  const [ventasPendientes, setVentasPendientes] = useState([]);
  const [deudaRange, setDeudaRange] = useState('month');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función optimizada para obtener ventas pendientes
  const fetchVentasPendientes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getToken();
      if (!token) {
        setError('No estás autorizado');
        return;
      }

      console.log('🔍 Obteniendo ventas pendientes...');
      
      // Usar la nueva ruta optimizada que ya creamos
      const response = await api.get('/cobros/ventas-pendientes-individuales', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const ventasConDeuda = response.data || [];
      console.log('📊 Ventas con deuda obtenidas:', ventasConDeuda.length);
      
      // Filtrar por rango de fechas si es necesario
      const ventasFiltradas = filtrarVentasPorRango(ventasConDeuda, deudaRange);
      
      setVentasPendientes(ventasFiltradas);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error al obtener ventas pendientes:', error);
      setError('Error al cargar las deudas pendientes: ' + (error.response?.data?.message || error.message));
      setVentasPendientes([]);
      setLoading(false);
    }
  }, [getToken, deudaRange]);

  // Función para filtrar ventas por rango de fechas
  const filtrarVentasPorRango = (ventas, range) => {
    if (range === 'historical') return ventas;
    
    const now = new Date();
    let fechaLimite = new Date();
    
    switch (range) {
      case 'day':
        fechaLimite.setHours(0, 0, 0, 0);
        break;
      case 'week':
        fechaLimite.setDate(now.getDate() - 7);
        break;
      case 'month':
        fechaLimite.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        fechaLimite.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return ventas;
    }
    
    return ventas.filter(venta => {
      if (!venta.fechaVenta) return true; // Incluir ventas sin fecha
      const fechaVenta = new Date(venta.fechaVenta);
      return fechaVenta >= fechaLimite;
    });
  };

  useEffect(() => {
    fetchVentasPendientes();
  }, [fetchVentasPendientes]);

  const handleDeudaRangeChange = (range) => {
    setDeudaRange(range);
  };

  // Función para obtener detalles de venta (si es necesario)
  const getDetallesVenta = useCallback(async (ventaId) => {
    try {
      const token = await getToken();
      const response = await api.get(`/ventas/${ventaId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data?.detalles || [];
    } catch (error) {
      console.error('Error al obtener detalles de venta:', error);
      return [];
    }
  }, [getToken]);

  const calcularResumen = () => {
    const totalDeuda = ventasPendientes.reduce((sum, venta) => sum + (venta.deudaPendiente || 0), 0);
    const totalVentas = ventasPendientes.length;
    const colaboradoresUnicos = [...new Set(ventasPendientes.map(v => v.colaboradorNombre))].length;
    
    return { totalDeuda, totalVentas, colaboradoresUnicos };
  };

  const { totalDeuda, totalVentas, colaboradoresUnicos } = calcularResumen();
  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Deudas Pendientes</h3>
      
      {/* Filtros por rango de fechas */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button 
          onClick={() => handleDeudaRangeChange('day')} 
          className={`px-4 py-2 rounded mb-2 transition-colors ${
            deudaRange === 'day' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
          }`}
        >
          Deudas de Hoy
        </button>
        <button 
          onClick={() => handleDeudaRangeChange('week')} 
          className={`px-4 py-2 rounded mb-2 transition-colors ${
            deudaRange === 'week' ? 'bg-teal-600 text-white' : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
          }`}
        >
          Deudas de la Semana
        </button>
        <button 
          onClick={() => handleDeudaRangeChange('month')} 
          className={`px-4 py-2 rounded mb-2 transition-colors ${
            deudaRange === 'month' ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
          }`}
        >
          Deudas del Mes
        </button>
        <button 
          onClick={() => handleDeudaRangeChange('year')} 
          className={`px-4 py-2 rounded mb-2 transition-colors ${
            deudaRange === 'year' ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-700 hover:bg-pink-200'
          }`}
        >
          Deudas del Año
        </button>
        <button 
          onClick={() => handleDeudaRangeChange('historical')} 
          className={`px-4 py-2 rounded mb-2 transition-colors ${
            deudaRange === 'historical' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Deudas Históricas
        </button>
      </div>

      {/* Resumen de estadísticas */}
      {!loading && ventasPendientes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-600 text-lg font-bold">S/ {totalDeuda.toFixed(2)}</div>
            <div className="text-red-700 text-sm">Total Deuda Pendiente</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-blue-600 text-lg font-bold">{totalVentas}</div>
            <div className="text-blue-700 text-sm">Ventas con Deuda</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-green-600 text-lg font-bold">{colaboradoresUnicos}</div>
            <div className="text-green-700 text-sm">Colaboradores con Deuda</div>
          </div>
        </div>
      )}

      {/* Mostrar errores */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {/* Contenido principal */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <span className="ml-3 text-gray-600">Cargando deudas pendientes...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ventasPendientes.length > 0 ? (
            ventasPendientes.map((venta) => (<div key={venta._id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                <div className="text-xs text-gray-500 mb-2">
                  Venta ID: #{venta.ventaId} | Fecha: {venta.fechaFormateada}
                </div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-lg font-semibold text-gray-800">{venta.colaboradorNombre}</h4>
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    Deuda: S/ {venta.deudaPendiente.toFixed(2)}
                  </span>
                </div>
                <div className="mb-2">
                  <span className="text-sm text-gray-600 font-medium">Productos:</span>
                  <ul className="list-disc ml-5 text-sm">
                    {venta.detalles && venta.detalles.length > 0 ? (
                      venta.detalles.map((det, idx) => (
                        <li key={det._id || idx}>
                          {det.productoId?.nombre || 'Producto sin nombre'} x {det.cantidad || 0}
                          {det.productoId?.precio && (
                            <span className="text-gray-500"> - S/ {det.productoId.precio.toFixed(2)}</span>
                          )}
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-400">Sin detalles de productos</li>
                    )}
                  </ul>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Venta:</span>
                    <span className="font-bold text-gray-800">S/ {(venta.montoTotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Debe:</span>
                    <span className="font-bold text-orange-600">S/ {(venta.deudaTotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pagado:</span>
                    <span className="font-bold text-green-600">S/ {(venta.sumaPagos || 0).toFixed(2)}</span>
                  </div>
                  {venta.sumaDevoluciones > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Devoluciones:</span>
                      <span className="font-bold text-blue-600">S/ {venta.sumaDevoluciones.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-100">
                    <span className="text-gray-600 font-medium">Deuda Pendiente:</span>
                    <span className="font-bold text-red-600">S/ {venta.deudaPendiente.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay deudas pendientes</h3>
              <p className="mt-1 text-sm text-gray-500">Todos los colaboradores están al día con sus pagos.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeudasPendientes;