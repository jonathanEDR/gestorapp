import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { toast } from 'react-toastify';
import api from '../services/api';

function DevolucionesList() {
  const { getToken } = useAuth();
  const [todasLasDevoluciones, setTodasLasDevoluciones] = useState([]);
  const [isLoadingDevoluciones, setIsLoadingDevoluciones] = useState(false);
  const [devolucionesError, setDevolucionesError] = useState(null);
  const [devolucionesVisibles, setDevolucionesVisibles] = useState(10);
  const [totalDevoluciones, setTotalDevoluciones] = useState(0);
  // Cargar todas las devoluciones
  const loadDevoluciones = useCallback(async () => {
    try {
      setIsLoadingDevoluciones(true);
      setDevolucionesError(null);
      
      const token = await getToken();
      
      // Cargar todas las devoluciones sin límite de paginación
      const response = await api.get('/ventas/devoluciones', {
        params: { page: 1, limit: 1000 }, // Límite alto para obtener todas
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('🔍 DEBUG: Respuesta completa del backend:', response.data);
      
      if (response.data && Array.isArray(response.data.devoluciones)) {
        console.log('🔍 DEBUG: Total devoluciones recibidas:', response.data.devoluciones.length);
        setTodasLasDevoluciones(response.data.devoluciones);
        setTotalDevoluciones(response.data.devoluciones.length);
      } else if (response.data && Array.isArray(response.data)) {
        console.log('🔍 DEBUG: Devoluciones como array directo:', response.data.length);
        setTodasLasDevoluciones(response.data);
        setTotalDevoluciones(response.data.length);
      } else {
        console.warn('Formato de respuesta inesperado:', response.data);
        setTodasLasDevoluciones([]);
        setTotalDevoluciones(0);
      }
    } catch (error) {
      console.error('Error al cargar devoluciones:', error);
      setDevolucionesError(error.message || 'Error al cargar las devoluciones');
      setTodasLasDevoluciones([]);
      setTotalDevoluciones(0);
      toast.error('Error al cargar las devoluciones');
    } finally {
      setIsLoadingDevoluciones(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadDevoluciones();
  }, [loadDevoluciones]);

  // Función para manejar la eliminación de una devolución
  const handleEliminarDevolucion = async (devolucionId) => {
    if (!window.confirm('¿Está seguro de eliminar esta devolución?')) {
      return;
    }

    try {
      const token = await getToken();
      await api.delete(`/ventas/devoluciones/${devolucionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      await loadDevoluciones();
      toast.success('Devolución eliminada correctamente');
    } catch (error) {
      console.error('Error al eliminar la devolución:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar la devolución');
    }
  };
  // Función para mostrar más devoluciones
  const handleVerMas = () => {
    setDevolucionesVisibles(prev => prev + 20);
  };
  // Función para agrupar devoluciones por venta
  const agruparDevoluciones = (devoluciones) => {
    console.log('🔍 DEBUG: Devoluciones a agrupar:', devoluciones.length);
    
    const grupos = devoluciones.reduce((acc, devolucion) => {
      const ventaId = devolucion.ventaId?._id;
      if (!ventaId) {
        console.log('🚨 DEBUG: Devolución sin ventaId válido:', devolucion);
        return acc;
      }

      if (!acc[ventaId]) {
        const fechaVenta = devolucion.ventaId?.fechaVenta;
        
        acc[ventaId] = {
          ventaId: ventaId,
          colaborador: devolucion.ventaId?.colaboradorId?.nombre || 'N/A',
          fechaVenta: fechaVenta,
          items: []
        };
      }

      acc[ventaId].items.push({
        _id: devolucion._id,
        producto: devolucion.productoId?.nombre || 'N/A',
        cantidad: devolucion.cantidadDevuelta,
        monto: devolucion.montoDevolucion,
        motivo: devolucion.motivo,
        fechaDevolucion: devolucion.fechaDevolucion
      });

      return acc;
    }, {});

    const gruposArray = Object.values(grupos);
    console.log('🔍 DEBUG: Grupos creados:', gruposArray.length);
    return gruposArray;
  };

  // Función para formatear la fecha
  const formatearFechaHora = (fecha) => {
    if (!fecha) return '';
    
    try {
      const fechaObj = new Date(fecha);
      if (isNaN(fechaObj.getTime())) {
        return 'Fecha inválida';
      }

      return fechaObj.toLocaleString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Error en fecha';
    }
  };
  // Renderizar la tabla de devoluciones
  const renderDevolucionesTable = () => {
    if (isLoadingDevoluciones) {
      return <div className="text-center py-4">Cargando devoluciones...</div>;
    }

    if (devolucionesError) {
      return (
        <div className="text-center py-4 text-red-600">
          Error: {devolucionesError}
          <button
            onClick={loadDevoluciones}
            className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Reintentar
          </button>
        </div>
      );
    }

    // Agrupar todas las devoluciones y luego tomar solo las visibles
    const todasAgrupadas = agruparDevoluciones(todasLasDevoluciones);
    const devolucionesAMostrar = todasAgrupadas.slice(0, devolucionesVisibles);
    
    console.log('🔍 DEBUG: Total agrupadas:', todasAgrupadas.length);
    console.log('🔍 DEBUG: Mostrando:', devolucionesAMostrar.length);
    console.log('🔍 DEBUG: Visibles configuradas:', devolucionesVisibles);

    return (
      <div className="overflow-x-auto">
        {/* Información de totales */}
        <div className="mb-4 text-sm text-gray-600">
          Mostrando {devolucionesAMostrar.length} de {todasAgrupadas.length} grupos de devoluciones 
          ({totalDevoluciones} devoluciones individuales en total)
        </div>
        
        <table className="min-w-full table-auto border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Colaborador</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Fecha Venta</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Productos Devueltos</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Total Devuelto</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {devolucionesAMostrar.length > 0 ? (
              devolucionesAMostrar.map((grupo) => (
                <tr key={grupo.ventaId} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-600 border-b">
                    {grupo.colaborador}
                  </td>

                  <td className="px-4 py-2 text-sm text-gray-600 border-b">
                    {formatearFechaHora(grupo.fechaVenta)}
                  </td>

                  <td className="px-4 py-2 text-sm text-gray-600 border-b">
                    <div className="space-y-1">
                      {grupo.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{item.cantidad}x {item.producto}</span>
                          <span className="text-gray-500 ml-2">({item.motivo})</span>
                        </div>
                      ))}
                    </div>
                  </td>

                  <td className="px-4 py-2 text-sm text-gray-600 border-b">
                    S/ {grupo.items.reduce((sum, item) => sum + item.monto, 0).toFixed(2)}
                  </td>
                  
                  <td className="px-4 py-2 text-sm text-gray-600 border-b">
                    <div className="space-y-1">
                      {grupo.items.map((item) => (
                        <button
                          key={item._id}
                          onClick={() => handleEliminarDevolucion(item._id)}
                          className="text-red-500 hover:text-red-700 block"
                        >
                          Eliminar
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-4 py-2 text-center text-gray-600">
                  No hay devoluciones registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* Botón Ver Más - solo se muestra si hay más grupos por mostrar */}
        {devolucionesAMostrar.length < todasAgrupadas.length && (
          <div className="flex justify-center mt-4">
            <button
              onClick={handleVerMas}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Ver más ({Math.min(20, todasAgrupadas.length - devolucionesAMostrar.length)} más)
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Historial de Devoluciones</h2>
      {renderDevolucionesTable()}
    </div>
  );
}

export default DevolucionesList;
