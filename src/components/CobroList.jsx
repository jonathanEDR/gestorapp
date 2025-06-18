import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api from '../services/api'; // Ajusta la ruta según la ubicación de tu archivo api.js
import CollectionsOverTimeChart from './graphics/CollectionsOverTimeChart';
import DeudasPendientes from './tablas/DeudasPendientes'; // Ajusta la ruta si es necesario
import CobroModal from './components/CobroModal';

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
  const [allCobrosForCharts, setAllCobrosForCharts] = useState([]); // Para gráficos
  const [newCobro, setNewCobro] = useState({
    colaboradorId: '',
    ventaId: '', // Nueva referencia a la venta específica
    montoPagado: 0,
    estadoPago: 'parcial',
    yape: 0, // Campo para Yape
    efectivo: 0, // Campo para Efectivo
    gastosImprevistos: 0,
    fechaPago: getFechaActualString(), // Campo para Fecha de Pago
  });
  const [colaboradores, setColaboradores] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [offset, setOffset] = useState(0); // Cambiar currentPage por offset
  const [hasMore, setHasMore] = useState(true); // Para controlar si hay más datos
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false); // Para el botón "Ver más"
  const [selectedRange, setSelectedRange] = useState('month');

const [isSubmittingCobro, setIsSubmittingCobro] = useState(false);  // Función para cargar cobros (inicial y "ver más")
  const fetchCobros = useCallback(async (reset = false) => {
    try {
      const currentOffset = reset ? 0 : offset;
      setLoading(reset ? true : false);
      setLoadingMore(reset ? false : true);
      
      const token = await getToken();
      if (!token) {
        alert('No estás autorizado');
        return;
      }

      const response = await api.get(`/cobros?offset=${currentOffset}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data) {
        const { cobros: newCobros, allCobrosForCharts, hasMore: moreAvailable, isFirstLoad } = response.data;
        
        if (reset || isFirstLoad) {
          // Primera carga: reemplazar todos los datos
          setCobros(newCobros);
          if (allCobrosForCharts) {
            setAllCobrosForCharts(allCobrosForCharts);
          }
          setOffset(newCobros.length);
        } else {
          // Cargar más: agregar a los existentes
          setCobros(prev => [...prev, ...newCobros]);
          setOffset(prev => prev + newCobros.length);
        }
        
        setHasMore(moreAvailable);
      }

      setLoading(false);
      setLoadingMore(false);
    } catch (error) {
      console.error('Error al obtener los cobros:', error);
      setLoading(false);
      setLoadingMore(false);
    }
  }, [getToken, offset]);// Nueva función: obtener ventas individuales con deuda pendiente
  const fetchVentasPendientesIndividuales = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        console.log('No hay token de autenticación');
        return;
      }
      
      console.log('Obteniendo ventas individuales con deudas pendientes...');
      
      // Usar la nueva ruta para obtener ventas individuales
      const response = await api.get('/cobros/ventas-pendientes-individuales', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      const ventasConDeuda = response.data || [];
      console.log('Ventas individuales con deuda obtenidas:', ventasConDeuda);
      console.log('Cantidad de ventas:', ventasConDeuda.length);
      
      // Verificar que cada venta tenga los campos necesarios
      ventasConDeuda.forEach((venta, index) => {
        console.log(`Venta ${index + 1}:`, {
          id: venta._id,
          displayText: venta.displayText,
          deudaPendiente: venta.deudaPendiente,
          colaboradorNombre: venta.colaboradorNombre
        });
      });
        // En lugar de setColaboradores, ahora trabajamos con ventas individuales
      setColaboradores(ventasConDeuda);
    } catch (error) {
      console.error('Error al obtener las ventas con deudas pendientes:', error);
      console.error('Detalles del error:', error.response?.data);
      setColaboradores([]);
    }
  }, [getToken]);  // Función de debugging para probar la conexión
  const testVentasConnection = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        console.log('No hay token para testing');
        return;
      }
      
      console.log('🧪 TESTING: Probando conexión con ventas...');
      
      const response = await api.get('/cobros/test-ventas', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      console.log('🧪 TESTING: Respuesta de test-ventas:', response.data);
      
    } catch (error) {
      console.error('🧪 TESTING: Error en test-ventas:', error);
      console.error('🧪 TESTING: Error response:', error.response?.data);
    }
  }, [getToken]);  // Usa useEffect con la nueva función
  useEffect(() => {
    fetchCobros(true); // Primera carga completa
    fetchVentasPendientesIndividuales();
  }, [fetchCobros, fetchVentasPendientesIndividuales]);


const handleChange = (e) => {
  const { name, value } = e.target;

  // Si se selecciona una venta, extraer el colaboradorId automáticamente
  if (name === 'ventaSeleccionada') {
    const ventaSeleccionada = colaboradores.find(venta => venta._id === value);
    if (ventaSeleccionada) {
      setNewCobro((prev) => ({
        ...prev,
        ventaId: value,
        colaboradorId: ventaSeleccionada.colaboradorId,
        montoPagado: 0, // Resetear el monto
        yape: 0,
        efectivo: 0,
        gastosImprevistos: 0
      }));
    }
    return;
  }

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
  if (!newCobro.ventaId || !newCobro.colaboradorId || Number(newCobro.montoPagado) <= 0) {
    alert('Por favor, selecciona una venta y completa el monto correctamente.');
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

    // Validar que el monto no exceda la deuda de la venta seleccionada
    const ventaSeleccionada = colaboradores.find(venta => venta._id === newCobro.ventaId);
    if (!ventaSeleccionada) {
      alert('Venta no encontrada');
      return;
    }

    if (Number(newCobro.montoPagado) > ventaSeleccionada.deudaPendiente) {
      alert(`El monto pagado no puede exceder la deuda pendiente de S/ ${ventaSeleccionada.deudaPendiente.toFixed(2)}`);
      return;
    }

    // Enviar los datos del cobro con ventaId específica
    const cobroData = {
      colaboradorId: newCobro.colaboradorId,
      ventaId: newCobro.ventaId, // Incluir la venta específica
      fechaPago: newCobro.fechaPago,
      yape: Number(newCobro.yape || 0),
      efectivo: Number(newCobro.efectivo || 0),
      gastosImprevistos: Number(newCobro.gastosImprevistos || 0),
      montoPagado: Number(newCobro.montoPagado)
    };

    console.log('Datos del cobro que se enviarán:', cobroData);

    // Enviar los datos del cobro al backend
    const responseCobro = await api.post('/cobros', cobroData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });    // Si la creación del cobro fue exitosa, actualizar la UI
    if (responseCobro?.data) {
      refreshCobros(); // Usar refreshCobros en lugar de fetchCobros
      fetchVentasPendientesIndividuales(); // Actualizar la lista de ventas pendientes
      setNewCobro({
        colaboradorId: '',
        ventaId: '',
        montoPagado: 0,
        estadoPago: 'parcial',
        yape: 0,
        efectivo: 0,
        gastosImprevistos: 0,
        fechaPago: getFechaActualString(),
      });
      setShowForm(false); // Cerrar el formulario
      alert('Cobro agregado exitosamente');
    }
  } catch (error) {
    console.error('Error al agregar cobro:', error);
    alert('Error al agregar el cobro: ' + (error.response?.data?.message || error.message));
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
      });      // Refrescar la lista después de eliminar
      refreshCobros();
      alert('Cobro eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar el cobro:', error);
      alert('Error al eliminar el cobro: ' + (error.response?.data?.message || error.message));
    }
  };
  const toggleFormVisibility = () => {
    setShowForm(prevState => !prevState);
  };

  // Eliminar las funciones de paginación obsoletas
  // Ya no necesitamos goToNextPage, goToPreviousPage, etc.

// Agrega la función para manejar el cambio de rango
const handleRangeChange = (range) => {
  setSelectedRange(range);
};


// Función para cargar más cobros
  const loadMoreCobros = () => {
    fetchCobros(false);
  };

  // Función para refrescar toda la lista
  const refreshCobros = () => {
    setOffset(0);
    setHasMore(true);
    fetchCobros(true);
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
          
{/* Gráfico de cobros - Ahora usa todos los datos */}
<div className="mb-8">
  {allCobrosForCharts.length > 0 ? (
    <CollectionsOverTimeChart cobros={allCobrosForCharts} selectedRange={selectedRange} />
  ) : (
    <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-lg text-gray-500">No hay datos de cobros disponibles</p>
    </div>
  )}
</div><button
        className="toggle-form-btn bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 mb-4 mr-2"
        onClick={toggleFormVisibility}
      >
        {showForm ? 'Cancelar' : 'Agregar Cobro'}
      </button>
      
      {/* Botón de debugging temporal */}
      <button
        className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 mb-4"
        onClick={testVentasConnection}
      >
        🧪 Test Ventas
      </button>      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-lg text-gray-600">Cargando cobros...</p>
          <p className="text-sm text-gray-500">Obteniendo datos...</p>
        </div>
      ) : cobros.length > 0 ? (<>
{/* Tabla responsiva mejorada */}
<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
  <div className="overflow-x-auto">    <table className="min-w-full divide-y divide-gray-200">
<thead className="bg-gray-50">
<tr>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Colaborador</th>
<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Yape</th>
<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Efectivo</th>
<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gastos</th>
<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
</tr>
</thead>
<tbody className="bg-white divide-y divide-gray-200">
{cobros.map((cobro, index) => (
<tr key={cobro._id} className="hover:bg-gray-50 transition-colors duration-200">
<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
{index + 1}
</td>
<td className="px-6 py-4 whitespace-nowrap">
<div className="text-sm font-medium text-gray-900">
{cobro.colaboradorId && typeof cobro.colaboradorId === 'object'
? cobro.colaboradorId.nombre
: 'Desconocido'}
</div>
</td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
<span className="font-medium text-green-600">S/ {(cobro.yape || 0).toFixed(2)}</span>
</td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
<span className="font-medium text-blue-600">S/ {(cobro.efectivo || 0).toFixed(2)}</span>
</td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
<span className="font-medium text-red-600">S/ {(cobro.gastosImprevistos || 0).toFixed(2)}</span>
</td>
<td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
S/ {(cobro.montoPagado || 0).toFixed(2)}
</td>
<td className="px-6 py-4 whitespace-nowrap text-center">
{cobro.estadoPago === 'total' ? (
<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
Total
</span>
) : (
<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
Parcial
</span>
)}
</td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
<div className="text-sm">
{cobro.fechaPago 
? new Date(cobro.fechaPago).toLocaleDateString('es-PE', { 
day: '2-digit', month: '2-digit', year: 'numeric'
})
: 'Sin fecha'}
</div>
<div className="text-xs text-gray-500">
{cobro.fechaPago 
? new Date(cobro.fechaPago).toLocaleTimeString('es-PE', { 
hour: '2-digit', minute: '2-digit'
})
: ''}
</div>
</td>
<td className="px-6 py-4 whitespace-nowrap text-center">
<button
className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors duration-200"
onClick={() => handleDeleteCobro(cobro._id)}
>
<svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
</svg>
Eliminar
</button>
</td>
</tr>
))}
</tbody>
</table></div>
</div>

{/* Botón "Ver más" en lugar de paginación */}
{hasMore && !loading && (
  <div className="flex justify-center mt-6">
    <button
      onClick={loadMoreCobros}
      disabled={loadingMore}
      className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
        loadingMore 
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
          : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md'
      }`}
    >
      {loadingMore ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Cargando...
        </div>
      ) : (
        'Ver más cobros'
      )}
    </button>
  </div>
)}

{/* Información de totales */}
{cobros.length > 0 && (
  <div className="text-center mt-4 text-sm text-gray-600">
    Mostrando {cobros.length} de {allCobrosForCharts.length} cobros totales
  </div>
)}</>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <p className="text-lg text-gray-600 mb-2">No hay cobros registrados</p>
          <p className="text-sm text-gray-500 text-center">
            Los cobros que registres aparecerán aquí.<br />
            Haz clic en "Agregar Cobro" para comenzar.
          </p>
        </div>
      )}  

    {/* Modal para añadir un nuevo cobro */}
<CobroModal
        showForm={showForm}
        colaboradores={colaboradores}
        newCobro={newCobro}
        handleChange={handleChange}
        handleAddCobro={handleAddCobro}
        toggleFormVisibility={toggleFormVisibility}
        isSubmittingCobro={isSubmittingCobro}
      />

    {/* Tabla de Deudas Pendientes */}
    <div className="mt-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Deudas Pendientes</h3>
      <DeudasPendientes />
    </div>

    </div>
  );
}

export default CobroList;