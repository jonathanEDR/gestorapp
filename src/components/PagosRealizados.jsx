import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '@clerk/clerk-react';

function PagosRealizados() {
  const { getToken } = useAuth();
  const [pagos, setPagos] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pagoAEliminar, setPagoAEliminar] = useState(null);
  const [colaboradorSeleccionado, setColaboradorSeleccionado] = useState(null);
  const [nuevoPago, setNuevoPago] = useState({
    colaboradorId: '',
    fechaPago: new Date().toISOString().split('T')[0],
    montoTotal: 0,
    metodoPago: 'efectivo',
    periodoInicio: '',
    periodoFin: '',
    observaciones: '',
    estado: 'pagado'
  });

  const metodosPago = ['efectivo', 'transferencia', 'deposito', 'cheque'];
  const estadosPago = ['pagado', 'parcial', 'pendiente'];

  const getFechaActualString = () => {
    return new Date().toISOString().split('T')[0];
  };

  useEffect(() => {
    fetchPagos();
    fetchColaboradores();
    fetchRegistros();
  }, []);
  // Obtener todos los pagos
  const fetchPagos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      console.log('Token obtenido para fetchPagos:', token ? 'Sí' : 'No');
      if (!token) throw new Error('No estás autorizado');

      console.log('Haciendo petición a:', '/pagos-realizados');
      const response = await api.get('/pagos-realizados', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Respuesta de pagos:', response.data);
      setPagos(response.data || []);
    } catch (err) {
      console.error('Error al cargar pagos:', err);
      setError('Error al cargar pagos: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  // Obtener colaboradores
  const fetchColaboradores = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error('No estás autorizado');

      const response = await api.get('/gestion-personal/colaboradores', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (Array.isArray(response.data)) {
        const colaboradoresOrdenados = response.data.sort((a, b) => 
          a.nombre.localeCompare(b.nombre)
        );
        setColaboradores(colaboradoresOrdenados);
      } else {
        setColaboradores([]);
      }
    } catch (err) {
      console.error('Error al cargar colaboradores:', err);
      setColaboradores([]);
    }
  }, [getToken]);

  // Obtener registros para calcular montos pendientes
  const fetchRegistros = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error('No estás autorizado');

      const response = await api.get('/gestion-personal', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setRegistros(response.data || []);
    } catch (err) {
      console.error('Error al cargar registros:', err);
      setRegistros([]);
    }
  }, [getToken]);
  // Calcular monto pendiente por colaborador
  const calcularMontoPendiente = (colaboradorId) => {
    const registrosColaborador = registros.filter(r => r.colaboradorId?._id === colaboradorId);
    const pagosColaborador = pagos.filter(p => {
      // Manejar si colaboradorId está poblado o no
      const pagoColabId = typeof p.colaboradorId === 'object' 
        ? p.colaboradorId._id 
        : p.colaboradorId;
      return pagoColabId?.toString() === colaboradorId?.toString();
    });

    const totalGenerado = registrosColaborador.reduce((total, registro) => {
      const pagodiario = registro.pagodiario || 0;
      const faltante = registro.faltante || 0;
      const adelanto = registro.adelanto || 0;
      return total + (pagodiario - faltante - adelanto);
    }, 0);

    const totalPagado = pagosColaborador.reduce((total, pago) => total + pago.montoTotal, 0);

    return totalGenerado - totalPagado;
  };

  // Manejar cambios en los campos del formulario
  const handleInputChange = (field, value) => {
    setNuevoPago(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Abrir modal para agregar pago
  const abrirModalPago = (colaborador) => {
    const montoPendiente = calcularMontoPendiente(colaborador._id);
    
    setColaboradorSeleccionado(colaborador);
    setNuevoPago({
      colaboradorId: colaborador._id,
      fechaPago: getFechaActualString(),
      montoTotal: Math.max(0, montoPendiente),
      metodoPago: 'efectivo',
      periodoInicio: '',
      periodoFin: '',
      observaciones: '',
      estado: 'pagado'
    });
    setIsModalOpen(true);
  };
  // Agregar nuevo pago
  const handleAgregarPago = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      console.log('Token para agregar pago:', token ? 'Sí' : 'No');
      if (!token) throw new Error('No autorizado');

      const formData = {
        colaboradorId: nuevoPago.colaboradorId,
        fechaPago: new Date(nuevoPago.fechaPago).toISOString(),
        montoTotal: parseFloat(nuevoPago.montoTotal) || 0,
        metodoPago: nuevoPago.metodoPago,
        periodoInicio: nuevoPago.periodoInicio ? new Date(nuevoPago.periodoInicio).toISOString() : null,
        periodoFin: nuevoPago.periodoFin ? new Date(nuevoPago.periodoFin).toISOString() : null,
        observaciones: nuevoPago.observaciones.trim(),
        estado: nuevoPago.estado
      };

      console.log('Datos a enviar:', formData);
      console.log('URL completa:', api.defaults.baseURL + '/pagos-realizados');

      if (formData.montoTotal <= 0) {
        throw new Error('El monto debe ser mayor a 0');
      }

      const response = await api.post('/pagos-realizados', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Respuesta del servidor:', response.data);

      if (response.data) {
        await fetchPagos();
        setIsModalOpen(false);
        setColaboradorSeleccionado(null);
        setNuevoPago({
          colaboradorId: '',
          fechaPago: getFechaActualString(),
          montoTotal: 0,
          metodoPago: 'efectivo',
          periodoInicio: '',
          periodoFin: '',
          observaciones: '',
          estado: 'pagado'
        });
      }
    } catch (err) {
      console.error('Error al agregar pago:', err);
      setError(err.response?.data?.message || err.message || 'Error al agregar pago');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar pago
  const confirmarEliminarPago = async () => {
    if (!pagoAEliminar) return;

    try {
      const token = await getToken();
      if (!token) throw new Error('No estás autorizado');

      await api.delete(`/pagos-realizados/${pagoAEliminar}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setIsConfirmModalOpen(false);
      setPagoAEliminar(null);
      fetchPagos();
    } catch (err) {
      console.error('Error al eliminar pago:', err);
      setError('Error al eliminar pago: ' + (err.response?.data?.message || err.message));
      setIsConfirmModalOpen(false);
      setPagoAEliminar(null);
    }
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Pagos Realizados</h2>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Resumen de colaboradores con saldos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">        {colaboradores.map(colaborador => {
          const montoPendiente = calcularMontoPendiente(colaborador._id);
          const ultimoPago = pagos
            .filter(p => {
              const pagoColabId = typeof p.colaboradorId === 'object' 
                ? p.colaboradorId._id 
                : p.colaboradorId;
              return pagoColabId?.toString() === colaborador._id?.toString();
            })
            .sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago))[0];

          return (
            <div key={colaborador._id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-800">{colaborador.nombre}</h3>
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">
                      {colaborador.nombre.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded-full inline-block mt-2">
                  {colaborador.departamento}
                </p>
              </div>

              {/* Información financiera */}
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Saldo Pendiente:</span>
                    <span className={`font-bold ${montoPendiente > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      S/. {montoPendiente.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Último Pago:</span>
                    <span className="text-sm text-gray-700">
                      {ultimoPago ? formatearFecha(ultimoPago.fechaPago) : 'Sin pagos'}
                    </span>
                  </div>

                  {ultimoPago && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Monto Último:</span>
                      <span className="text-sm font-bold text-green-600">
                        S/. {ultimoPago.montoTotal.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Botón de acción */}
                <div className="mt-4">
                  <button
                    onClick={() => abrirModalPago(colaborador)}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    + Registrar Pago
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Historial de pagos */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Historial de Pagos</h3>
        </div>
        
        {pagos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg mb-2">No hay pagos registrados</p>
            <p className="text-sm">Los pagos aparecerán aquí una vez que los registres</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Colaborador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Pago
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Observaciones
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>              
              
              <tbody className="bg-white divide-y divide-gray-200">
                {pagos
                  .sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago))
                  .map((pago, index) => {
                    // Manejar si colaboradorId está poblado o no
                    let colaboradorNombre = 'Colaborador no encontrado';
                    
                    if (typeof pago.colaboradorId === 'object' && pago.colaboradorId?.nombre) {
                      // Si está poblado desde el backend
                      colaboradorNombre = pago.colaboradorId.nombre;
                    } else {
                      // Si no está poblado, buscar en la lista local
                      const colaborador = colaboradores.find(c => 
                        c._id.toString() === (pago.colaboradorId?.toString() || pago.colaboradorId)
                      );
                      colaboradorNombre = colaborador?.nombre || 'Colaborador no encontrado';
                    }
                    
                    console.log('Debug pago:', {
                      pagoId: pago._id,
                      colaboradorId: pago.colaboradorId,
                      tipoColaboradorId: typeof pago.colaboradorId,
                      colaboradorNombre: colaboradorNombre
                    });
                    
                    return (                      <tr key={pago._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {colaboradorNombre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatearFecha(pago.fechaPago)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                          S/. {pago.montoTotal.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {pago.metodoPago}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            pago.estado === 'pagado' ? 'bg-green-100 text-green-800' :
                            pago.estado === 'parcial' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {pago.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                          <div className="truncate" title={pago.observaciones}>
                            {pago.observaciones || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setPagoAEliminar(pago._id);
                              setIsConfirmModalOpen(true);
                            }}
                            className="text-red-600 hover:text-red-900 hover:bg-red-50 px-3 py-1 rounded transition-colors"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para agregar pago */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-screen overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              Registrar Pago - {colaboradorSeleccionado?.nombre}
            </h3>
            <form onSubmit={handleAgregarPago} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fecha de Pago *</label>
                <input
                  type="date"
                  value={nuevoPago.fechaPago}
                  onChange={(e) => handleInputChange('fechaPago', e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Monto Total *</label>
                <input
                  type="number"
                  step="0.01"
                  value={nuevoPago.montoTotal}
                  onChange={(e) => handleInputChange('montoTotal', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="0.00"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Saldo pendiente: S/. {calcularMontoPendiente(nuevoPago.colaboradorId).toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Método de Pago *</label>
                <select
                  value={nuevoPago.metodoPago}
                  onChange={(e) => handleInputChange('metodoPago', e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                >
                  {metodosPago.map(metodo => (
                    <option key={metodo} value={metodo}>
                      {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Estado del Pago *</label>
                <select
                  value={nuevoPago.estado}
                  onChange={(e) => handleInputChange('estado', e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                >
                  {estadosPago.map(estado => (
                    <option key={estado} value={estado}>
                      {estado.charAt(0).toUpperCase() + estado.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Período Inicio</label>
                  <input
                    type="date"
                    value={nuevoPago.periodoInicio}
                    onChange={(e) => handleInputChange('periodoInicio', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Período Fin</label>
                  <input
                    type="date"
                    value={nuevoPago.periodoFin}
                    onChange={(e) => handleInputChange('periodoFin', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Observaciones</label>
                <textarea
                  value={nuevoPago.observaciones}
                  onChange={(e) => handleInputChange('observaciones', e.target.value)}
                  className="w-full p-2 border rounded"
                  rows="3"
                  placeholder="Observaciones adicionales del pago..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setColaboradorSeleccionado(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Confirmar Eliminación</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar este pago? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setPagoAEliminar(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminarPago}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PagosRealizados;
