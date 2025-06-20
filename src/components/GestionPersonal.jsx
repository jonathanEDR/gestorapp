import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '@clerk/clerk-react';
import PagosRealizados from './PagosRealizados';

function GestionPersonal() {

  const getFechaActualString = () => {
    const hoy = new Date();
    // Formatear fecha y hora al formato requerido por datetime-local
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    const hora = String(hoy.getHours()).padStart(2, '0');
    const minutos = String(hoy.getMinutes()).padStart(2, '0');
    
    return `${año}-${mes}-${dia}T${hora}:${minutos}`;
  };

  const { getToken } = useAuth();
  const [registros, setRegistros] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [colaboradorSeleccionado, setColaboradorSeleccionado] = useState(null); // Nuevo estado
  const [nuevoRegistro, setNuevoRegistro] = useState({
    colaboradorId: '',
    fechaDeGestion: getFechaActualString(),
    sueldo: '',
    descripcion: '',
    monto: '',
    faltante: 0,
    adelanto: 0,
    diasLaborados: 1
  });
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [registroAEliminar, setRegistroAEliminar] = useState(null);
  const [vistaActual, setVistaActual] = useState('colaboradores'); // 'colaboradores' o 'detalle'
  const [colaboradorDetalle, setColaboradorDetalle] = useState(null); // Para vista detalle
  const [filtroFecha, setFiltroFecha] = useState('month'); // 'semana', 'mes', 'año', 'historico'
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);  const [customDateRange, setCustomDateRange] = useState({
  start: '',
  end: ''
});
  const [vistaActivaGestion, setVistaActivaGestion] = useState('registros'); // 'registros' o 'pagos'


  useEffect(() => {
    fetchRegistros();
    fetchColaboradores();
  }, []);

  // Obtener todos los registros
  async function fetchRegistros() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('No estás autorizado');

      const response = await api.get('/gestion-personal', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setRegistros(response.data || []);
    } catch (err) {
      console.error('Error al cargar registros:', err);
      setError('Error al cargar registros: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }

  // Obtener lista de colaboradores
  async function fetchColaboradores() {
    try {
      const token = await getToken();
      if (!token) throw new Error('No estás autorizado');

      const response = await api.get('/gestion-personal/colaboradores', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Verificar que los datos recibidos son válidos
      if (Array.isArray(response.data)) {
        // Ordenar colaboradores por nombre
        const colaboradoresOrdenados = response.data.sort((a, b) => 
          a.nombre.localeCompare(b.nombre)
        );
        setColaboradores(colaboradoresOrdenados);
      } else {
        setColaboradores([]);
        console.error('Formato de datos de colaboradores inválido');
      }
    } catch (err) {
      console.error('Error al cargar colaboradores:', err);
      setError('Error al cargar colaboradores: ' + (err.response?.data?.message || err.message));
      setColaboradores([]);
    }
  }

  // Función para mostrar detalle del colaborador
  const mostrarDetalleColaborador = (colaborador) => {
    setColaboradorDetalle(colaborador);
    setVistaActual('detalle');
  };

  // Función para volver a la vista de colaboradores
  const volverAColaboradores = () => {
    setColaboradorDetalle(null);
    setVistaActual('colaboradores');
  };
  const abrirModalParaColaborador = (colaborador) => {

      // Calcular pago diario
  const pagoDiario = colaborador.sueldo ? (colaborador.sueldo / 30).toFixed(2) : 0;
  
    setColaboradorSeleccionado(colaborador);
    setNuevoRegistro({
      colaboradorId: colaborador._id,
      fechaDeGestion: getFechaActualString(),
      sueldo: colaborador.sueldo || '',
      descripcion: '',
      monto: '',
      faltante: 0,
      adelanto: 0,
      diasLaborados: 1,
      pagodiario: parseFloat(pagoDiario)
    });
    setIsModalOpen(true);
  };

  // Manejar cambios en los campos
  const handleInputChange = (field, value) => {
    setNuevoRegistro(prev => ({
      ...prev,
      [field]: value
    }));
  };

async function handleAgregarRegistro(e) {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    const token = await getToken();
    if (!token) throw new Error('No autorizado');

    const fechaSeleccionada = new Date(nuevoRegistro.fechaDeGestion);

    // Formatear los datos correctamente
    const formData = {
      colaboradorId: nuevoRegistro.colaboradorId,
      fechaDeGestion: fechaSeleccionada.toISOString(),
      sueldo: parseFloat(nuevoRegistro.sueldo) || 0,
      descripcion: nuevoRegistro.descripcion.trim(),
      monto: parseFloat(nuevoRegistro.monto) || 0,
      faltante: parseFloat(nuevoRegistro.faltante) || 0,
      adelanto: parseFloat(nuevoRegistro.adelanto) || 0,
      diasLaborados: parseInt(nuevoRegistro.diasLaborados) || 1,
      pagodiario: parseFloat(nuevoRegistro.pagodiario) || 0
    };

    // Validación modificada para permitir valores en 0
    if (!formData.colaboradorId) {
      throw new Error('Por favor seleccione un colaborador');
    }

    if (!formData.descripcion) {
      throw new Error('Por favor ingrese una descripción');
    }

    // Validar que los valores numéricos sean válidos (pueden ser 0 o positivos)
    const numericos = {
      monto: formData.monto,
      faltante: formData.faltante,
      adelanto: formData.adelanto,
      pagodiario: formData.pagodiario
    };

    for (const [campo, valor] of Object.entries(numericos)) {
      if (typeof valor !== 'number' || isNaN(valor) || valor < 0) {
        throw new Error(`El campo ${campo} debe ser un número válido mayor o igual a 0`);
      }
    }

    const response = await api.post(
      '/gestion-personal',
      formData, 
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (response.data) {
    await fetchRegistros();
          setIsModalOpen(false);
      setColaboradorSeleccionado(null);
      setNuevoRegistro({
        colaboradorId: '',
        fechaDeGestion: getFechaActualString(),
        sueldo: '',
        descripcion: '',
        monto: '0',
        faltante: '0',
        adelanto: '0',
        diasLaborados: 1,
        pagodiario: 0
      });
    }
  } catch (err) {
    console.error('Error al agregar registro:', err);
    setError(err.response?.data?.message || err.message || 'Error al agregar registro');
  } finally {
    setLoading(false);
  }
}

  const handleEliminarRegistro = async (id) => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const token = await getToken();
      if (!token) throw new Error('No autorizado');

      await api.delete(`/gestion-personal/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Actualizar el estado solo si la eliminación fue exitosa
      setRegistros(prevRegistros => prevRegistros.filter(registro => registro._id !== id));
      
    } catch (err) {
      console.error('Error al eliminar:', err);
      setError('Error al eliminar el registro: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  // Mostrar modal de confirmación para eliminar
  function mostrarConfirmacionEliminar(registroId) {
    setRegistroAEliminar(registroId);
    setIsConfirmModalOpen(true);
  }

  // Confirmar eliminación
  async function confirmarEliminarRegistro() {
    if (!registroAEliminar) return;

    try {
      const token = await getToken();
      if (!token) throw new Error('No estás autorizado');

      await api.delete(`/gestion-personal/${registroAEliminar}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setIsConfirmModalOpen(false);
      setRegistroAEliminar(null);
      fetchRegistros();
    } catch (err) {
      console.error('Error al eliminar registro:', err);
      setError('Error al eliminar registro: ' + (err.response?.data?.message || err.message));
      setIsConfirmModalOpen(false);
      setRegistroAEliminar(null);
    }
  }

  // Cancelar eliminación
  function cancelarEliminarRegistro() {
    setIsConfirmModalOpen(false);
    setRegistroAEliminar(null);
  }

  // Función para formatear la fecha
  function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',  
      hour12: false
    });
  }

const filtrarRegistrosPorFecha = (registros) => {
  if (filtroFecha === 'historico') return registros;

  const hoy = new Date();
  let inicio = new Date();
  let fin = new Date();

  switch (filtroFecha) {
    case 'semana':
      // Obtener el lunes de la semana actual
      const diaSemana = hoy.getDay(); // 0 = Domingo, 1 = Lunes, ...
      const diferenciaDias = diaSemana === 0 ? 6 : diaSemana - 1;
      inicio = new Date(hoy);
      inicio.setDate(hoy.getDate() - diferenciaDias);
      inicio.setHours(0, 0, 0, 0);

      // Establecer el fin al domingo
      fin = new Date(inicio);
      fin.setDate(inicio.getDate() + 6);
      fin.setHours(23, 59, 59, 999);
      break;

    case 'mes':
      // Primer día del mes actual
      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      inicio.setHours(0, 0, 0, 0);
      
      // Último día del mes actual
      fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      fin.setHours(23, 59, 59, 999);
      break;

    case 'año':
      // Primer día del año actual
      inicio = new Date(hoy.getFullYear(), 0, 1);
      inicio.setHours(0, 0, 0, 0);
      
      // Último día del año actual
      fin = new Date(hoy.getFullYear(), 11, 31);
      fin.setHours(23, 59, 59, 999);
      break;

    default:
      return registros;
  }

  return registros.filter(registro => {
    const fechaRegistro = new Date(registro.fechaDeGestion);
    return fechaRegistro >= inicio && fechaRegistro <= fin;
  });
};


// Modificar la función obtenerRegistrosDeColaborador
const obtenerRegistrosDeColaborador = (colaboradorId) => {
  const registrosColaborador = registros.filter(registro => 
    registro.colaboradorId?._id === colaboradorId
  );
  return filtrarRegistrosPorFecha(registrosColaborador);
};

  // Función para calcular el total de gastos de un colaborador
  const calcularTotalGastos = (colaboradorId) => {
    const registrosColaborador = obtenerRegistrosDeColaborador(colaboradorId);
    return registrosColaborador.reduce((total, registro) => total + (registro.monto || 0), 0);
  };

  const calcularTotalFaltantes = (colaboradorId) => {
    const registrosColaborador = obtenerRegistrosDeColaborador(colaboradorId);
    return registrosColaborador.reduce((total, registro) => total + (registro.faltante || 0), 0);
  }

const calcularTotalAdelantos = (colaboradorId) => {
    const registrosColaborador = obtenerRegistrosDeColaborador(colaboradorId);
    return registrosColaborador.reduce((total, registro) => total + (registro.adelanto || 0), 0);
  }

const calcularTotalpagodiario = (colaboradorId) => {

    const registrosColaborador = obtenerRegistrosDeColaborador(colaboradorId);
    return registrosColaborador.reduce((total, registro) => total + (registro.pagodiario || 0), 0);
  };

  // calcular el total a pagar pago diario - total faltantes + total adelantos = totalPagar
  const calcularTotalPagar = (colaboradorId) => {
    const totalPagodiario = calcularTotalpagodiario(colaboradorId);
    const totalFaltantes = calcularTotalFaltantes(colaboradorId);
    const totalAdelantos = calcularTotalAdelantos(colaboradorId);
    return totalPagodiario - (totalFaltantes + totalAdelantos);
  };

const handleCustomDateRange = () => {
  if (customDateRange.start && customDateRange.end) {
    setFiltroFecha('personalizado');
  }
};


  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">Gestión de Personal</h2>
          {vistaActual === 'detalle' && colaboradorDetalle && (
            <span className="text-lg text-gray-600">- {colaboradorDetalle.nombre}</span>
          )}
        </div>
            <div className="flex space-x-2 mb-4">
              {vistaActual === 'detalle' && (
                <button
                  onClick={volverAColaboradores}
                  className="group relative inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-600 to-gray-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:from-slate-700 hover:to-gray-700 border border-gray-500/20"
                >
                  {/* Ícono de flecha con animación */}
                  <div className="transform group-hover:-translate-x-1 transition-transform duration-300">
                    <svg 
                      className="w-4 h-4" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                      />
                    </svg>
                  </div>
                  
                  <span className="text-sm">Volver a Colaboradores</span>
                  
                  {/* Efecto de brillo */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              )}
            </div>
      </div>

      {/* Pestañas de navegación */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setVistaActivaGestion('registros')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              vistaActivaGestion === 'registros'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📝 Registros de Trabajo
          </button>
          <button
            onClick={() => setVistaActivaGestion('pagos')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              vistaActivaGestion === 'pagos'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            💰 Pagos Realizados
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Contenido según la pestaña activa */}
      {vistaActivaGestion === 'pagos' ? (
        <PagosRealizados />
      ) : (
        <>
          {/* Contenido original del componente (registros de trabajo) */}
          {/* ... resto del código existente ... */}

<div className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 p-6">
  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
    {/* Filtros de fecha */}
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => setFiltroFecha('semana')}
        className={`relative px-5 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
          filtroFecha === 'semana'
            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-200/50'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
        }`}
      >
        <span className="relative z-10 text-sm">📅 Última Semana</span>
        {filtroFecha === 'semana' && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-xl blur opacity-30"></div>
        )}
      </button>
      
      <button
        onClick={() => setFiltroFecha('mes')}
        className={`relative px-5 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
          filtroFecha === 'mes'
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-200/50'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
        }`}
      >
        <span className="relative z-10 text-sm">🗓️ Último Mes</span>
        {filtroFecha === 'mes' && (
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl blur opacity-30"></div>
        )}
      </button>
      
      <button
        onClick={() => setFiltroFecha('año')}
        className={`relative px-5 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
          filtroFecha === 'año'
            ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg shadow-purple-200/50'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
        }`}
      >
        <span className="relative z-10 text-sm">📊 Último Año</span>
        {filtroFecha === 'año' && (
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-violet-400 rounded-xl blur opacity-30"></div>
        )}
      </button>
      
      <button
        onClick={() => setFiltroFecha('historico')}
        className={`relative px-5 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
          filtroFecha === 'historico'
            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200/50'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
        }`}
      >
        <span className="relative z-10 text-sm">🏛️ Histórico</span>
        {filtroFecha === 'historico' && (
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-400 rounded-xl blur opacity-30"></div>
        )}
      </button>
    </div>
    
      <div className="flex items-center space-x-2">
        <input
          type="date"
          value={customDateRange.start}
          onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <span className="text-gray-500">-</span>
        <input
          type="date"
          value={customDateRange.end}
          onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={handleCustomDateRange}
          disabled={!customDateRange.start || !customDateRange.end}
          className={`relative px-5 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
            filtroFecha === 'personalizado'
              ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg shadow-green-200/50'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
          }`}
        >
          <span className="relative z-10 text-sm">📊 Aplicar</span>
          {filtroFecha === 'personalizado' && (
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-teal-400 rounded-xl blur opacity-30"></div>
          )}
        </button>
      </div>

    {/* Indicador de estado */}
    <div className="flex items-center gap-3">
      <div className="hidden lg:block w-px h-8 bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-4 py-2 rounded-xl border border-gray-200/50">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            filtroFecha === 'semana' ? 'bg-blue-400' :
            filtroFecha === 'mes' ? 'bg-green-400' :
            filtroFecha === 'año' ? 'bg-purple-400' :
            'bg-orange-400'
          }`}></div>
          <span className="text-sm font-medium text-gray-700">
            {filtroFecha === 'historico' 
              ? 'Todos los registros'
              : filtroFecha === 'semana'
              ? 'Semana actual (Lun - Dom)'
              : filtroFecha === 'mes'
              ? `Mes de ${new Date().toLocaleString('es-ES', { month: 'long' })}`
              : `Año ${new Date().getFullYear()}`
            }
          </span>
        </div>
      </div>
    </div>
  </div>
</div>

          {/* Vista Detalle de Colaborador */}
    {vistaActual === 'detalle' && colaboradorDetalle && (
      <div className="space-y-4">
        {/* Información del Colaborador */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-1">Nombre Completo</h3>
              <p className="text-lg font-semibold text-blue-900">{colaboradorDetalle.nombre}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-800 mb-1">Departamento</h3>
              <p className="text-lg font-semibold text-green-900">{colaboradorDetalle.departamento}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-800 mb-1">Sueldo Mensual</h3>
              <p className="text-lg font-semibold text-yellow-900">S/. {colaboradorDetalle.sueldo?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-purple-800 mb-1">Total Registros</h3>
              <p className="text-lg font-semibold text-purple-900">{obtenerRegistrosDeColaborador(colaboradorDetalle._id).length}</p>
            </div>
          </div>

          {/* Resumen Financiero en una sola fila */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
              <h3 className="text-sm font-medium text-yellow-800 mb-1">Total Pagos</h3>
              <p className="text-xl font-bold text-yellow-900">
                S/. {calcularTotalpagodiario(colaboradorDetalle._id).toFixed(2)}
              </p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400">
              <h3 className="text-sm font-medium text-orange-800 mb-1">Total Faltantes</h3>
              <p className="text-xl font-bold text-orange-900">
                S/. {calcularTotalFaltantes(colaboradorDetalle._id).toFixed(2)}
              </p>
            </div>

            <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-400">
              <h3 className="text-sm font-medium text-indigo-800 mb-1">Total Adelantos</h3>
              <p className="text-xl font-bold text-indigo-900">
                S/. {calcularTotalAdelantos(colaboradorDetalle._id).toFixed(2)}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-400">
              <h3 className="text-sm font-medium text-gray-800 mb-1">Total a Pagar</h3>
              <p className="text-xl font-bold text-gray-900">
                S/. {calcularTotalPagar(colaboradorDetalle._id).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
              <h3 className="text-sm font-medium text-red-800 mb-1">Total Gastos</h3>
              <p className="text-xl font-bold text-red-900">S/. {calcularTotalGastos(colaboradorDetalle._id).toFixed(2)}</p>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={() => abrirModalParaColaborador(colaboradorDetalle)}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              + Agregar Nuevo Registro
            </button>
          </div>
        </div>

              {/* Historial de Registros */}
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">Historial de Registros</h3>
                </div>
                
                {obtenerRegistrosDeColaborador(colaboradorDetalle._id).length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p className="text-lg mb-2">No hay registros para este colaborador</p>
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
                            Descripción
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Monto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Faltante
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Adelanto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Días Laborados
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pago Diario
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {obtenerRegistrosDeColaborador(colaboradorDetalle._id)
                          .sort((a, b) => new Date(b.fechaDeGestion) - new Date(a.fechaDeGestion))
                          .map((registro, index) => (
                          <tr key={registro._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatearFecha(registro.fechaDeGestion)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <div className="max-w-xs">
                                <p className="truncate" title={registro.descripcion}>
                                  {registro.descripcion}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              S/. {registro.monto?.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={`px-2 py-1 rounded-sm text-xs ${
                                registro.faltante > 0 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                S/. {registro.faltante?.toFixed(2) || '0.00'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={`px-2 py-1 rounded-sm text-xs ${
                                registro.adelanto > 0 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                S/. {registro.adelanto?.toFixed(2) || '0.00'}
                              </span>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {registro.diasLaborados || 'N/A'}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              S/. {registro.pagodiario?.toFixed(2) || '0.00'}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => mostrarConfirmacionEliminar(registro._id)}
                                className="text-red-600 hover:text-red-900 hover:bg-red-50 px-3 py-1 rounded transition-colors"
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

      {/* Vista de Colaboradores */}
      {vistaActual === 'colaboradores' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {colaboradores.map(colaborador => {
            const registrosColaborador = obtenerRegistrosDeColaborador(colaborador._id);
            const totalGastos = calcularTotalGastos(colaborador._id);
            
            return (
              <div 
                key={colaborador._id} 
                onClick={() => mostrarDetalleColaborador(colaborador)}
                className="group bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100/50 hover:border-blue-200/50 hover:-translate-y-1 cursor-pointer"
              >
                {/* Header compacto */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-100/50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-700 transition-colors truncate">
                      {colaborador.nombre}
                    </h3>
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xs">
                        {colaborador.nombre.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded-full inline-block">
                    {colaborador.departamento}
                  </p>
                </div>

                {/* Información principal */}
                <div className="p-4">
                  {/* Métricas principales compactas */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="text-center p-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100/50">
                      <p className="text-xs font-medium text-green-600 mb-1">Sueldo Bruto</p>
                      <p className="text-sm font-bold text-green-700">
                        S/. {colaborador.sueldo?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div className="text-center p-2 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-100/50">
                      <p className="text-xs font-medium text-orange-600 mb-1">Sueldo Neto</p>
                      <p className="text-sm font-bold text-orange-700">
                        S/. {calcularTotalPagar(colaborador._id).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Información adicional compacta */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center py-1 text-xs">
                      <span className="font-medium text-gray-600">Faltantes</span>
                      <span className="font-bold text-red-600">
                        S/. {calcularTotalFaltantes(colaborador._id).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 text-xs">
                      <span className="font-medium text-gray-600">Adelantos</span>
                      <span className="font-bold text-purple-600">
                        S/. {calcularTotalAdelantos(colaborador._id).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 text-xs">
                      <span className="font-medium text-gray-600">Registros</span>
                      <span className="font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                        {registrosColaborador.length}
                      </span>
                    </div>
                  </div>


                  {/* Botones de acción */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => abrirModalParaColaborador(colaborador)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      disabled={loading}
                    >
                      <span className="text-sm">+ Registro</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para agregar registro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-screen overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              Nuevo Registro - {colaboradorSeleccionado?.nombre}
            </h3>
            <form onSubmit={handleAgregarRegistro} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fecha *</label>
                <input
                  type="datetime-local"
                  value={nuevoRegistro.fechaDeGestion}
                  onChange={(e) => handleInputChange('fechaDeGestion', e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descripción del Gasto *</label>
                <input
                  type="text"
                  value={nuevoRegistro.descripcion}
                  onChange={(e) => handleInputChange('descripcion', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Descripción del gasto o trabajo realizado"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Monto *</label>
                <input
                  type="number"
                  step="0.01"
                  value={nuevoRegistro.monto}
                  onChange={(e) => handleInputChange('monto', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Faltante</label>
                <input
                  type="number"
                  step="0.01"
                  value={nuevoRegistro.faltante}
                  onChange={(e) => handleInputChange('faltante', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Adelanto</label>
                <input
                  type="number"
                  step="0.01"
                  value={nuevoRegistro.adelanto}
                  onChange={(e) => handleInputChange('adelanto', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Pago Diario</label>
                <input
                  type="number"
                  step="0.01"
                  value={nuevoRegistro.pagodiario}
                  className="w-full p-2 border rounded bg-gray-50"
                  placeholder="0.00"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  Calculado automáticamente (Sueldo mensual ÷ 30)
                </p>
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
                  {loading ? 'Guardando...' : 'Guardar'}
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
              ¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelarEliminarRegistro}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminarRegistro}                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >                Eliminar
              </button>
            </div>          
          </div>
        </div>
      )}
        </>
      )}
      
    </div>
  );
}

export default GestionPersonal;