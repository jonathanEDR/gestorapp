import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api from '../../services/api';  // Asegúrate de que la ruta sea correcta

const DeudasPendientes = () => {
  const { getToken } = useAuth();
  const [deudasColaboradores, setDeudasColaboradores] = useState([]);
  const [deudaRange, setDeudaRange] = useState('month');
  const [loading, setLoading] = useState(false);

  // Función para obtener deudas detalladas
// Filtrar las ventas y cobros dentro del rango de fechas
const fetchDeudasDetalladas = useCallback(async () => {
  try {
    setLoading(true);
    const token = await getToken();
    if (!token) {
      alert('No estás autorizado');
      return;
    }

    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    // Determinar el rango de fechas según deudaRange
    switch (deudaRange) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate.setDate(now.getDate() - now.getDay());  // Inicio de la semana
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(startDate.getDate() + 6);  // Fin de la semana
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate.setDate(1);  // Primer día del mes
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(now.getMonth() + 1, 0);  // Último día del mes anterior
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'year':
        startDate.setMonth(0, 1);  // Primer día del año
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(11, 31);  // Último día del año
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'historical':
        startDate = null;
        endDate = null;
        break;
      default:
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setMonth(now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    // Obtener ventas y cobros en paralelo con el filtro de fecha
    const [ventasResponse, cobrosResponse] = await Promise.all([
      api.get('/ventas', {
        headers: { 'Authorization': `Bearer ${token}` },
        params: {
          startDate: startDate ? startDate.toISOString() : null,
          endDate: endDate ? endDate.toISOString() : null
        }
      }),
      api.get('/cobros', {
        headers: { 'Authorization': `Bearer ${token}` },
        params: {
          startDate: startDate ? startDate.toISOString() : null,
          endDate: endDate ? endDate.toISOString() : null
        }
      })
    ]);

    // Procesar ventas y cobros por colaborador
    const deudasPorColaborador = {};

    // Procesar ventas
    ventasResponse.data.ventas.forEach(venta => {
      const fechaVenta = new Date(venta.fechadeVenta || venta.fechaVenta);

      // Filtrar solo las ventas que están dentro del rango de fechas
      if (startDate && fechaVenta < startDate) return;
      if (endDate && fechaVenta > endDate) return;

      const colaboradorId = venta.colaboradorId._id;
      if (!deudasPorColaborador[colaboradorId]) {
        deudasPorColaborador[colaboradorId] = {
          colaboradorId: colaboradorId,
          colaboradorNombre: venta.colaboradorId.nombre,
          productos: {},
          totalDeuda: 0,
          cobrado: 0,
          deudaPendiente: 0, // Iniciar deuda pendiente en 0
          fechaVenta: fechaVenta, // Guardamos la fecha de venta aquí
        };
      }

      // Procesar la venta
      const producto = venta.productoId;
      const nombreProducto = producto.nombre;
      const montoVenta = Number(venta.montoTotal);

      if (!deudasPorColaborador[colaboradorId].productos[nombreProducto]) {
        deudasPorColaborador[colaboradorId].productos[nombreProducto] = {
          cantidad: 0,
          montoTotal: 0
        };
      }

      deudasPorColaborador[colaboradorId].productos[nombreProducto].cantidad += venta.cantidad;
      deudasPorColaborador[colaboradorId].productos[nombreProducto].montoTotal += montoVenta;
      deudasPorColaborador[colaboradorId].totalDeuda += montoVenta;
    });

    // Procesar cobros
    cobrosResponse.data.cobros.forEach(cobro => {
      const fechaCobro = new Date(cobro.fechaPago || cobro.fechaCobro);

      // Filtrar solo los cobros dentro del rango de fechas
      if (startDate && fechaCobro < startDate) return;
      if (endDate && fechaCobro > endDate) return;

      const colaboradorId = typeof cobro.colaboradorId === 'object' ? cobro.colaboradorId._id : cobro.colaboradorId;

      if (deudasPorColaborador[colaboradorId]) {
        const montoPagado = Number(cobro.montoPagado || 0);
        deudasPorColaborador[colaboradorId].cobrado += montoPagado;

        // Actualizar deuda pendiente
        deudasPorColaborador[colaboradorId].deudaPendiente = deudasPorColaborador[colaboradorId].totalDeuda - deudasPorColaborador[colaboradorId].cobrado;
      }
    });

    // Filtrar y ordenar las deudas para mostrar en la UI
    const deudasPendientes = Object.values(deudasPorColaborador)
      .map(deuda => {
        return {
          ...deuda,
          deudaPendiente: deuda.totalDeuda - deuda.cobrado // Aseguramos que la deuda pendiente se calcule correctamente
        };
      })
      .filter(deuda => deuda.deudaPendiente > 0) // Solo mostrar deudas pendientes
      .sort((a, b) => b.deudaPendiente - a.deudaPendiente); // Ordenar por deuda pendiente

    setDeudasColaboradores(deudasPendientes);
    setLoading(false);

  } catch (error) {
    console.error('Error al obtener deudas detalladas:', error);
    alert('Error al obtener las deudas detalladas');
    setLoading(false);
  }
}, [getToken, deudaRange]);


  
  useEffect(() => {
    fetchDeudasDetalladas();
  }, [fetchDeudasDetalladas, deudaRange]);

  const handleDeudaRangeChange = (range) => {
    setDeudaRange(range);
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Deudas Pendientes</h3>
      <div className="flex flex-wrap space-x-2 mb-4">
        <button onClick={() => handleDeudaRangeChange('day')} className={`px-4 py-2 rounded mb-2 transition-colors ${deudaRange === 'day' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}>Deudas de Hoy</button>
        <button onClick={() => handleDeudaRangeChange('week')} className={`px-4 py-2 rounded mb-2 transition-colors ${deudaRange === 'week' ? 'bg-teal-600 text-white' : 'bg-teal-100 text-teal-700 hover:bg-teal-200'}`}>Deudas de la Semana</button>
        <button onClick={() => handleDeudaRangeChange('month')} className={`px-4 py-2 rounded mb-2 transition-colors ${deudaRange === 'month' ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}>Deudas del Mes</button>
        <button onClick={() => handleDeudaRangeChange('year')} className={`px-4 py-2 rounded mb-2 transition-colors ${deudaRange === 'year' ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-700 hover:bg-pink-200'}`}>Deudas del Año</button>
        <button onClick={() => handleDeudaRangeChange('historical')} className={`px-4 py-2 rounded mb-2 transition-colors ${deudaRange === 'historical' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Deudas Históricas</button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deudasColaboradores.length > 0 ? (
            deudasColaboradores.map((deuda) => (
              <div key={deuda.colaboradorId} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                <div className="text-xs text-gray-500 mb-2">
  Fecha de Venta: {deuda.fechaVenta ? new Date(deuda.fechaVenta).toLocaleDateString() : 'No disponible'}
                </div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">{deuda.colaboradorNombre}</h4>
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    Deuda: S/ {deuda.deudaPendiente.toFixed(2)}
                  </span>
                </div>
                
                {/* Lista de productos */}
                <div className="space-y-2">
                  {Object.entries(deuda.productos || {}).map(([nombreProducto, info]) => (
                    <div key={nombreProducto} className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700">{nombreProducto}</div>
                        <div className="text-xs text-gray-500">
                          Cantidad: {info.cantidad} unidades
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-gray-800">
                        S/ {info.montoTotal.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Línea divisoria */}
                <div className="my-4 border-t border-gray-200"></div>
                
                {/* Totales */}
<div className="space-y-2">
  <div className="flex justify-between items-center text-sm">
    <span className="font-medium text-gray-600">Total Vendido:</span>
    <span className="font-bold text-gray-800">S/ {deuda.totalDeuda.toFixed(2)}</span>
  </div>
  <div className="flex justify-between items-center text-sm">
    <span className="font-medium text-gray-600">Total Pagado:</span>
    <span className="font-bold text-green-600">
      {deuda.cobrado > 0 ? `S/ ${deuda.cobrado.toFixed(2)}` : 'Sin pagos'}
    </span>
  </div>
  <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
    <span className="font-medium text-gray-600">Deuda Pendiente:</span>
    <span className="font-bold text-red-600">S/ {deuda.deudaPendiente.toFixed(2)}</span>
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