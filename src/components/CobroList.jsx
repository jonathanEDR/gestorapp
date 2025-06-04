import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api from '../services/api'; // Ajusta la ruta según la ubicación de tu archivo api.js
import CollectionsOverTimeChart from './graphics/CollectionsOverTimeChart';
import DeudasPendientes from './tablas/DeudasPendientes'; // Ajusta la ruta si es necesario


// Modificar esta función para incluir la hora
const getFechaActualString = () => {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, '0');
  const day = String(hoy.getDate()).padStart(2, '0');
  const hours = String(hoy.getHours()).padStart(2, '0');
  const minutes = String(hoy.getMinutes()).padStart(2, '0');
  const seconds = String(hoy.getSeconds()).padStart(2, '0');
  
  // Formato: YYYY-MM-DDTHH:MM:SS
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};


function CobroList() {
  const { getToken } = useAuth();
  const [cobros, setCobros] = useState([]);
  const [newCobro, setNewCobro] = useState({
    colaboradorId: '',
    montoPagado: 0,
    estadoPago: 'parcial',
      yape: 0, // Campo para Yape
      efectivo: 0, // ampo para Efectivo
      gastosImprevistos: 0,
      fechaPago: getFechaActualString(), // Campo para Fecha de Pago
});
  const [colaboradores, setColaboradores] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedRange, setSelectedRange] = useState('month');

const [isSubmittingCobro, setIsSubmittingCobro] = useState(false);

  // Envuelve fetchCobros en useCallback
  const fetchCobros = useCallback(async (page) => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        alert('No estás autorizado');
        return;
      }

    const response = await api.get(`/cobros?page=${page}&limit=15&populate=colaboradorId`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (Array.isArray(response.data)) {
        setCobros(response.data);
        setTotalPages(1);
      } else if (response.data && Array.isArray(response.data.cobros)) {
        setCobros(response.data.cobros);
        setTotalPages(response.data.totalPages || 1);
      } else {
        setCobros([]);
        console.error('Formato de respuesta inesperado:', response.data);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error al obtener los cobros:', error);
      setLoading(false);
    }
  }, [getToken]);

  // Envuelve fetchColaboradores en useCallback
  const fetchColaboradores = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        alert('No estás autorizado');
        return;
      }

      const response = await api.get('/colaboradores', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

    // Para cada colaborador, obtener su deuda pendiente
    const colaboradoresConDeuda = await Promise.all(
      response.data.map(async (colaborador) => {
        const deudaResponse = await api.get(`/cobros/debtInfo/${colaborador._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        return {
          ...colaborador,
          deudaPendiente: deudaResponse.data.remainingDebt
        };
      })
    );

    // Filtrar solo colaboradores con deuda pendiente
    const colaboradoresDeudores = colaboradoresConDeuda.filter(
      colaborador => colaborador.deudaPendiente > 0
    );

      setColaboradores(colaboradoresDeudores);
    } catch (error) {
      console.error('Error al obtener los colaboradores:', error);
    }
  }, [getToken]);


  // Usa useEffect con las funciones envueltas en useCallback
  useEffect(() => {
    fetchCobros(currentPage);
    fetchColaboradores();
  }, [fetchCobros, fetchColaboradores, currentPage]);


const handleChange = (e) => {
  const { name, value } = e.target;

  

  // Actualizar el valor del campo correspondiente
  setNewCobro((prev) => {
    const updatedCobro = {
      ...prev,
      [name]: value,
    };

    // Asegurar que el montoPagado siempre sea la suma de Yape, Efectivo y Gastos Imprevistos
    updatedCobro.montoPagado = Number(updatedCobro.yape || 0) + Number(updatedCobro.efectivo || 0) + Number(updatedCobro.gastosImprevistos || 0);

    return updatedCobro;
  });
};


const handleAddCobro = async () => {
  // Validar que todos los campos necesarios estén llenos
  if (!newCobro.colaboradorId || Number(newCobro.montoPagado) <= 0) {
    alert('Por favor, completa todos los campos correctamente.');
    return;
  }

  try {
      setIsSubmittingCobro(true);
    // Obtener el token de autenticación
    const token = await getToken();
    if (!token) {
      alert('No estás autorizado');
      return;
    }

    // Obtener la deuda pendiente del colaborador
    const response = await api.get(`/cobros/debtInfo/${newCobro.colaboradorId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const deudaPendiente = response.data.remainingDebt;

    // Validar que el monto pagado no exceda la deuda pendiente
    if (Number(newCobro.montoPagado) > deudaPendiente) {
      alert(`El monto pagado no puede exceder la deuda pendiente de ${deudaPendiente}`);
      return;
    }

    // Determinar el estado de pago
    const estadoPago = Number(newCobro.montoPagado) === deudaPendiente ? 'total' : 'parcial';

    // Enviar los datos del cobro sin modificar la fecha, ya que la fecha será gestionada en el backend
    const cobroData = {
      ...newCobro,
      fechaPago: newCobro.fechaPago, // Mantener la fecha tal como está, sin modificaciones
      montoPagado: Number(newCobro.montoPagado),
      estadoPago
    };

    console.log('Fecha que se está enviando:', cobroData.fechaPago); // Para debugging

    // Enviar los datos del cobro al backend
    const responseCobro = await api.post('/cobros', cobroData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Si la creación del cobro fue exitosa, actualizar la UI
    if (responseCobro?.data) {
      fetchCobros(1); // Actualizar la lista de cobros
      setCurrentPage(1);
      setNewCobro({
        colaboradorId: '',
        montoPagado: 0,
        estadoPago: 'parcial',
        yape: 0,
        efectivo: 0,
        gastosImprevistos: 0,
        fechaPago: getFechaActualString(),// Restablecer la fecha de pago
      });
      setShowForm(false); // Cerrar el formulario
      alert('Cobro agregado exitosamente');
    }
  } catch (error) {
    console.error('Error al verificar deuda pendiente:', error);
    alert('Error al verificar deuda pendiente');
   } finally {
    setIsSubmittingCobro(false);
 
  }
};



  const handleDeleteCobro = async (id) => {
    if (!id) {
      alert('ID del cobro no válido.');
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        alert('No estás autorizado');
        return;
      }

      await api.delete(`/cobros/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Refrescar la lista después de eliminar
      fetchCobros(currentPage);
      alert('Cobro eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar el cobro:', error);
      alert('Error al eliminar el cobro: ' + (error.response?.data?.message || error.message));
    }
  };

  const toggleFormVisibility = () => {
    setShowForm(prevState => !prevState);
  };

  // Funciones para la paginación
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

// Agrega la función para manejar el cambio de rango
const handleRangeChange = (range) => {
  setSelectedRange(range);
};



  return (
    <div className="list">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Control de Efectivo </h2>
      
      {/* Botones para seleccionar el rango de tiempo */}
<div className="flex flex-wrap space-x-2 mb-8">
  <button 
    onClick={() => handleRangeChange('day')} 
    className={`px-4 py-2 rounded mb-2 transition-colors ${selectedRange === 'day' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
  >
    Hoy
  </button>
  <button 
    onClick={() => handleRangeChange('week')} 
    className={`px-4 py-2 rounded mb-2 transition-colors ${selectedRange === 'week' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
  >
    Esta Semana
  </button>
  <button 
    onClick={() => handleRangeChange('month')} 
    className={`px-4 py-2 rounded mb-2 transition-colors ${selectedRange === 'month' ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}
  >
    Este Mes
  </button>
  <button 
    onClick={() => handleRangeChange('year')} 
    className={`px-4 py-2 rounded mb-2 transition-colors ${selectedRange === 'year' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
  >
    Este Año
  </button>
  <button 
    onClick={() => handleRangeChange('historical')} 
    className={`px-4 py-2 rounded mb-2 transition-colors ${selectedRange === 'historical' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
  >
    Histórico
  </button>
</div>
       {/* Indicador de rango seleccionado */}
          <div className="mt-4 flex items-center gap-3">
            <div className="hidden lg:block w-px h-8 bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-4 py-2 rounded-xl border border-gray-200/50">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  selectedRange === 'day' ? 'bg-blue-400' :
                  selectedRange === 'week' ? 'bg-green-400' :
                  selectedRange === 'month' ? 'bg-purple-400' :
                  selectedRange === 'year' ? 'bg-amber-400' :
                  'bg-gray-400'
                }`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {selectedRange === 'historical' 
                    ? 'Todos los registros'
                    : selectedRange === 'day'
                    ? 'Hoy'
                    : selectedRange === 'week'
                    ? 'Semana actual (Lun - Dom)'
                    : selectedRange === 'month'
                    ? `Mes de ${new Date().toLocaleString('es-ES', { month: 'long' })}`
                    : `Año ${new Date().getFullYear()}`
                  }
                </span>
              </div>
            </div>
          </div>
          
{/* Gráfico de cobros */}
<div className="mb-8">
  {cobros.length > 0 ? (
    <CollectionsOverTimeChart cobros={cobros} selectedRange={selectedRange} />
  ) : (
    <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-lg text-gray-500">No hay datos de cobros disponibles</p>
    </div>
  )}
</div>

      <button
        className="toggle-form-btn bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 mb-4"
        onClick={toggleFormVisibility}
      >
        {showForm ? 'Cancelar' : 'Agregar Cobro'}
      </button>
  
      {loading ? (
        <div className="flex justify-center">
          <p className="text-gray-600">Cargando cobros...</p>
        </div>
      ) : cobros.length > 0 ? (
        <>
<table className="min-w-full table-auto border-collapse border border-gray-300 mb-4">
  <thead className="bg-gray-100">
    <tr>
      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">#</th>
      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Colaborador</th>
      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Yape</th>
      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Efectivo</th>
      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Gastos Imprevistos</th>
      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Monto Pagado</th>
      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Estado de Pago</th>
      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Fecha</th>

      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Acciones</th>
    </tr>
  </thead>
  <tbody>
    {cobros.map((cobro, index) => (
      <tr key={cobro._id} className="hover:bg-gray-50">
        <td className="px-4 py-2 text-sm text-gray-600 border-b">{index + 1}</td>

        <td className="px-4 py-2 text-sm text-gray-600 border-b">
          {cobro.colaboradorId && typeof cobro.colaboradorId === 'object'
            ? cobro.colaboradorId.nombre
            : 'Desconocido'}
        </td>

        <td className="px-4 py-2 text-sm text-gray-600 border-b">S/ {cobro.yape || 0}</td>
        <td className="px-4 py-2 text-sm text-gray-600 border-b">S/ {cobro.efectivo || 0}</td>
        <td className="px-4 py-2 text-sm text-gray-600 border-b">S/ {cobro.gastosImprevistos || 0}</td>
        <td className="px-4 py-2 text-sm text-gray-600 border-b">S/ {cobro.montoPagado || 0}</td>
        <td className="px-4 py-2 text-sm text-gray-600 border-b">
          {cobro.estadoPago === 'total' ? (
            <span className="text-green-500 font-semibold">total</span>
          ) : (
            <span className="text-blue-500 font-semibold">parcial</span>
          )}
        </td>
<td className="px-4 py-2 text-sm text-gray-600 border-b">
  {cobro.fechaPago 
    ? new Date(cobro.fechaPago).toLocaleString('es-PE', { 
        weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
      }) 
    : 'Sin fecha'}
</td>


        <td className="px-4 py-2 text-sm text-gray-600 border-b">
          <button
            className="text-red-500 hover:text-red-700"
            onClick={() => handleDeleteCobro(cobro._id)}
          >
            Eliminar
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>

          {/* Controles de paginación */}

<div className="flex justify-between items-center">
  <div className="text-sm text-gray-600">
    Página {currentPage} de {totalPages}
  </div>
  <div className="flex space-x-2">
    <button
      onClick={goToPreviousPage}
      disabled={currentPage === 1}
      className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
    >
      Anterior
    </button>
    <button
      onClick={goToNextPage}
      disabled={currentPage === totalPages}
      className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
    >
      Siguiente
    </button>
  </div>
</div>

        </>
      ) : (
        <p className="text-gray-600">No hay cobros registrados.</p>
      )}
  

    <div className="list">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Control de Efectivo </h2>
      
      {/* Aquí puedes agregar el componente DeudasPendientes */}
      <DeudasPendientes />

      {/* El resto de tu código para la lista de cobros */}
    </div>
    
    
{/* Modal para añadir un nuevo cobro */}
{showForm && (
  <div className="modal-overlay fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
    <div className="modal-content bg-white rounded-lg shadow-lg w-96 p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Agregar Cobro</h3>

      {/* Select Colaborador con deuda pendiente */}
      <div className="mb-4">
        <label htmlFor="colaboradorId" className="block text-sm font-medium text-gray-700">
          Seleccionar Colaborador con Deuda Pendiente
        </label>
        {colaboradores.length > 0 ? (
          <select
            name="colaboradorId"
            id="colaboradorId"
            value={newCobro.colaboradorId}
            onChange={handleChange}
            className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Seleccione un colaborador</option>
            {colaboradores
              .filter(colaborador => colaborador.deudaPendiente > 0)
              .map((colaborador) => (
                <option 
                  key={colaborador._id} 
                  value={colaborador._id}
                  className="py-2"
                >
                  {colaborador.nombre} - Deuda: S/ {colaborador.deudaPendiente.toFixed(2)}
                </option>
            ))}
          </select>
        ) : (
          <div className="mt-2 p-4 bg-gray-50 rounded-md">
            <p className="text-gray-600 text-center">No hay colaboradores con deudas pendientes</p>
          </div>
        )}
      </div>

      {newCobro.colaboradorId && (
        <>
       {/* Campo para Fecha de Pago */}
<div className="mb-4">
  <label htmlFor="fechaPago" className="block text-sm font-medium text-gray-700">
    Fecha del Cobro
  </label>
<input
  type="datetime-local"
  id="fechaPago"
  name="fechaPago"
  value={newCobro.fechaPago}  // Se mantiene la fecha y la hora
  onChange={(e) => {
    setNewCobro({
      ...newCobro,
      fechaPago: e.target.value, // Se actualiza la fecha y hora
    });
  }}
  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
/>

</div>

          {/* Campos de pago */}
          <div className="space-y-4">
            {/* Campo para Yape */}
            <div className="mb-4">
              <label htmlFor="yape" className="block text-sm font-medium text-gray-700">
                Yape
              </label>
              <input
                type="number"
                name="yape"
                id="yape"
                placeholder="Monto transferido via Yape"
                value={newCobro.yape || 0}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Campo para Efectivo */}
            <div className="mb-4">
              <label htmlFor="efectivo" className="block text-sm font-medium text-gray-700">
                Efectivo
              </label>
              <input
                type="number"
                name="efectivo"
                id="efectivo"
                placeholder="Monto en efectivo"
                value={newCobro.efectivo || 0}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Campo para Gastos Imprevistos */}
            <div className="mb-4">
              <label htmlFor="gastosImprevistos" className="block text-sm font-medium text-gray-700">
                Gastos Imprevistos
              </label>
              <input
                type="number"
                name="gastosImprevistos"
                id="gastosImprevistos"
                placeholder="Gastos adicionales"
                value={newCobro.gastosImprevistos || 0}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            {/* Total Pagado (calculado automáticamente) */}
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total a Pagar:</span>
                <span className="text-lg font-bold text-gray-900">
                  S/ {newCobro.montoPagado.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Botones de acción */}
      <div className="flex justify-end space-x-2 mt-6">
        <button
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          onClick={toggleFormVisibility}
        >
          Cancelar
        </button>
  <button
    className={`px-4 py-2 rounded-md text-white 
      ${newCobro.colaboradorId && newCobro.montoPagado > 0 && !isSubmittingCobro
        ? 'bg-blue-500 hover:bg-blue-600'
        : 'bg-gray-400 cursor-not-allowed'}`}
    onClick={handleAddCobro}
    disabled={!newCobro.colaboradorId || newCobro.montoPagado <= 0 || isSubmittingCobro}
  >
    {isSubmittingCobro ? 'Guardando...' : 'Agregar Cobro'}
  </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

export default CobroList;