import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '@clerk/clerk-react';
import ModalIngreso from './modals/ModalIngreso';
import ModalEgreso from './modals/ModalEgreso';

function Caja() {
  const { getToken } = useAuth();  const [resumen, setResumen] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalIngresoOpen, setIsModalIngresoOpen] = useState(false);
  const [isModalEgresoOpen, setIsModalEgresoOpen] = useState(false);
  const [periodo, setPeriodo] = useState('day');

  const periodos = [
    { value: 'day', label: 'Hoy' },
    { value: 'week', label: 'Esta Semana' },
    { value: 'month', label: 'Este Mes' }
  ];
  // Obtener resumen de la caja
  const fetchResumen = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('No estás autorizado');

      const response = await api.get(`/caja/resumen?periodo=${periodo}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setResumen(response.data);
    } catch (err) {
      console.error('Error al cargar resumen:', err);
      setError('Error al cargar resumen: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [getToken, periodo]);

  // Obtener movimientos
  const fetchMovimientos = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await api.get('/caja/movimientos?limit=20', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMovimientos(response.data.movimientos || []);
    } catch (err) {
      console.error('Error al cargar movimientos:', err);
    }
  }, [getToken]);  useEffect(() => {
    fetchResumen();
    fetchMovimientos();
  }, [fetchResumen, fetchMovimientos]);
  // Función para actualizar datos después de registrar movimiento
  const handleMovimientoSuccess = useCallback(async () => {
    await fetchResumen();
    await fetchMovimientos();
  }, [fetchResumen, fetchMovimientos]);

  // Función para eliminar movimiento
  const handleEliminarMovimiento = async (movimientoId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este movimiento? Esta acción eliminará tanto el movimiento de caja como el registro relacionado y no se puede deshacer.')) {
      return;
    }

    try {
      setLoading(true);
      const token = await getToken();
      if (!token) throw new Error('No estás autorizado');

      const response = await api.delete(`/caja/movimiento/${movimientoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Movimiento eliminado:', response.data);
      
      // Mostrar mensaje de éxito
      if (response.data.eliminadoTambien) {
        alert(`Movimiento eliminado exitosamente. También se eliminó el registro de: ${response.data.eliminadoTambien}`);
      } else {
        alert('Movimiento eliminado exitosamente');
      }

      // Actualizar datos
      await handleMovimientoSuccess();
    } catch (err) {
      console.error('Error al eliminar movimiento:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error al eliminar movimiento';
      alert('Error: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Categorías para mostrar nombres legibles
  const categoriasDisponibles = {
    ingresos: [
      { value: 'venta_directa', label: 'Venta Directa' },
      { value: 'cobro', label: 'Cobro de Cliente' },
      { value: 'devolucion_proveedor', label: 'Devolución de Proveedor' },
      { value: 'prestamo_recibido', label: 'Préstamo Recibido' },
      { value: 'ingreso_extra', label: 'Ingreso Extra' }
    ],
    egresos: [
      { value: 'pago_personal', label: 'Pago Personal' },
      { value: 'pago_proveedor', label: 'Pago a Proveedor' },
      { value: 'gasto_operativo', label: 'Gasto Operativo' },
      { value: 'servicio_basico', label: 'Servicio Básico' },
      { value: 'alquiler', label: 'Alquiler' },
      { value: 'transporte', label: 'Transporte' },
      { value: 'marketing', label: 'Marketing' },
      { value: 'impuestos', label: 'Impuestos' },
      { value: 'egreso_extra', label: 'Egreso Extra' }
    ]
  };

  // Formatear monto
  const formatearMonto = (monto) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(monto);
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !resumen) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-4 text-lg">Cargando caja...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">💰 Control de Caja</h2>
          <p className="text-gray-600">Gestión centralizada de ingresos y egresos</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {periodos.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Saldo Principal y Botones de Acción */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 text-white">
        <div className="text-center mb-6">
          <h3 className="text-lg font-medium opacity-90">Saldo Actual</h3>
          <p className={`text-5xl font-bold mb-2 ${
            resumen?.saldoActual >= 0 ? 'text-green-200' : 'text-red-200'
          }`}>
            {resumen ? formatearMonto(resumen.saldoActual) : 'S/. 0.00'}
          </p>
          <p className="text-sm opacity-75">
            Actualizado en tiempo real
          </p>
        </div>        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setIsModalIngresoOpen(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            ➕ Registrar Ingreso
          </button>
          <button
            onClick={() => setIsModalEgresoOpen(true)}
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            ➖ Registrar Egreso
          </button>
        </div>
      </div>

      {/* Métricas del Período */}
      {resumen && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Ingresos ({periodos.find(p => p.value === periodo)?.label})
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatearMonto(resumen.totalIngresos)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xl">📈</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Egresos ({periodos.find(p => p.value === periodo)?.label})
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {formatearMonto(resumen.totalEgresos)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-xl">📉</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Flujo Neto</p>
                <p className={`text-2xl font-bold ${
                  resumen.flujoNeto >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatearMonto(resumen.flujoNeto)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xl">⚖️</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Movimientos */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Movimientos Recientes ({movimientos.length})
          </h3>
        </div>
        
        {movimientos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg mb-2">No hay movimientos registrados</p>
            <p className="text-sm">Los movimientos aparecerán aquí una vez que los registres</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Origen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movimientos.map((mov, index) => (
                  <tr key={mov._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatearFecha(mov.fecha)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        mov.tipo === 'ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {mov.tipo === 'ingreso' ? '⬆️ Ingreso' : '⬇️ Egreso'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {categoriasDisponibles[mov.tipo + 's']?.find(c => c.value === mov.categoria)?.label || mov.categoria}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={mov.descripcion}>
                        {mov.descripcion}
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                      mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {mov.tipo === 'ingreso' ? '+' : '-'}{formatearMonto(mov.monto)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      mov.saldoActual >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatearMonto(mov.saldoActual)}
                    </td>                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        <span>{mov.esAutomatico ? '🤖 Auto' : '✋ Manual'}</span>
                        <button
                          onClick={() => handleEliminarMovimiento(mov._id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded-md transition-colors duration-200"
                          title="Eliminar movimiento"
                          disabled={loading}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>      {/* Modales */}
      <ModalIngreso 
        isOpen={isModalIngresoOpen}
        onClose={() => setIsModalIngresoOpen(false)}
        onSuccess={handleMovimientoSuccess}
      />
      
      <ModalEgreso 
        isOpen={isModalEgresoOpen}
        onClose={() => setIsModalEgresoOpen(false)}
        onSuccess={handleMovimientoSuccess}
      />
    </div>
  );
}

export default Caja;
