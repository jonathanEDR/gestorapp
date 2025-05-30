import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '@clerk/clerk-react';
import GastosOverTimeChart from './graphics/GastosOverTimeChart';

function GastoList() {

// Reemplazar la función obtenerFechaActual actual por:
const obtenerFechaActual = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // Ajusta la zona horaria
  return now.toISOString().slice(0, 16); // Formato YYYY-MM-DDTHH:mm
};


  const [gastos, setGastos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState('');  // Definir el estado para la sección activa


// Agregar estos estados adicionales
const [viewMode, setViewMode] = useState('summary'); // 'summary' o 'detailed'
const [showGastosList, setShowGastosList] = useState(false);
const [selectedCategory, setSelectedCategory] = useState('');
const [expandedProduct, setExpandedProduct] = useState(null);

// Estados necesarios (agregar a tu useState)
const [dateFilter, setDateFilter] = useState('all');
const [customDateRange, setCustomDateRange] = useState({
  start: '',
  end: '',
  active: false
});

  const initialGasto = {
    _id: null,
    descripcion: '',
    costoUnidad: '',
    cantidad: '',
    tipoDeGasto: '',
    gasto: '',
    fechaGasto: obtenerFechaActual()
  };
  
  const [nuevoGasto, setNuevoGasto] = useState(initialGasto);
  const { isLoaded, isSignedIn, getToken } = useAuth();




  const fetchGastos = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await api.get('/gastos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGastos(response.data);
    } catch (error) {
      console.error('Error al obtener los gastos:', error);
      setError('Error al cargar los gastos. Por favor, intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    fetchGastos();
  }, [fetchGastos]);

  // Validar formulario
  const validarFormulario = () => {
    const { descripcion, costoUnidad, cantidad, tipoDeGasto, gasto } = nuevoGasto;
    
    if (!descripcion.trim()) {
      setError('La descripción es requerida');
      return false;
    }
    
    if (!costoUnidad || parseFloat(costoUnidad) < 0) {
      setError('El costo por unidad debe ser mayor o igual a 0');
      return false;
    }
    
    if (!cantidad || parseFloat(cantidad) <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return false;
    }
    
    if (!tipoDeGasto) {
      setError('Debe seleccionar un tipo de gasto');
      return false;
    }
    
    if (!gasto) {
      setError('Debe seleccionar una categoría de gasto');
      return false;
    }
    
    return true;
  };

const handleAddGasto = async () => {
  if (!validarFormulario()) return;
  
  setIsSubmitting(true);
  setError(null);
  
  try {
    const token = await getToken();
    const montoTotal = parseFloat(nuevoGasto.costoUnidad) * parseFloat(nuevoGasto.cantidad);
    
    // Convertir la fecha a ISO string con la zona horaria local
    const fechaLocal = new Date(nuevoGasto.fechaGasto);
    const fechaISO = fechaLocal.toISOString();

    await api.post('/gastos', 
      { 
        ...nuevoGasto, 
        montoTotal,
        fechaGasto: fechaISO // Usar la fecha en formato ISO
      },
      { headers: { Authorization: `Bearer ${token}` }}
    );
    
    resetForm();
    await fetchGastos();
  } catch (error) {
    console.error('Error al agregar gasto:', error);
    setError('Error al agregar el gasto. Por favor, intenta nuevamente.');
  } finally {
    setIsSubmitting(false);
  }
};

  const handleUpdateGasto = async () => {
    if (!validarFormulario()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const token = await getToken();
      const montoTotal = parseFloat(nuevoGasto.costoUnidad) * parseFloat(nuevoGasto.cantidad);
      
      await api.put(`/gastos/${nuevoGasto._id}`, 
        { 
          ...nuevoGasto, 
          montoTotal,
          fechaGasto: nuevoGasto.fechaGasto || obtenerFechaActual()
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      resetForm();
      await fetchGastos();
    } catch (error) {
      console.error('Error al actualizar gasto:', error);
      setError('Error al actualizar el gasto. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGasto = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este gasto?')) return;
    
    setError(null);
    
    try {
      const token = await getToken();
      await api.delete(`/gastos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchGastos();
    } catch (error) {
      console.error('Error al eliminar gasto:', error);
      setError('Error al eliminar el gasto. Por favor, intenta nuevamente.');
    }
  };

  const handleEditGasto = (gasto) => {
    setNuevoGasto({
      ...gasto,
      costoUnidad: gasto.costoUnidad.toString(),
      cantidad: gasto.cantidad.toString()
    });
    setShowForm(true);
    setError(null);
  };

  const resetForm = () => {
  const fechaActual = obtenerFechaActual();
  setNuevoGasto({
    ...initialGasto,
    fechaGasto: fechaActual
  });
  setShowForm(false);
  setError(null);
};

const handleInputChange = (field, value) => {
  if (field === 'fechaGasto') {
    // Asegurarse de que la fecha sea válida
    const fechaValida = value ? value : obtenerFechaActual();
    setNuevoGasto(prev => ({ ...prev, [field]: fechaValida }));
  } else {
    setNuevoGasto(prev => ({ ...prev, [field]: value }));
  }
  if (error) setError(null);
};

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

const formatDate = (dateString) => {
  try {
    const fecha = new Date(dateString);
    // Usar la zona horaria de Perú específicamente
    return new Intl.DateTimeFormat('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/Lima'
    }).format(fecha);
  } catch {
    return 'Fecha inválida';
  }
};


const handleSectionChange = (section, categoria) => {
  setActiveSection(section);
  setSelectedCategory(categoria);
  setShowGastosList(true);
};



// Función para filtrar gastos por categoría
const getGastosByCategory = (categoria) => {
  return gastos.filter(gasto => gasto.gasto === categoria);
};

// Función para agrupar gastos por tipo de gasto
const groupGastosByType = (gastos) => {
  return gastos.reduce((groups, gasto) => {
    const tipo = gasto.tipoDeGasto;
    if (!groups[tipo]) {
      groups[tipo] = [];
    }
    groups[tipo].push(gasto);
    return groups;
  }, {});
};

// Función para calcular total por tipo
const getTotalByType = (gastos) => {
  return gastos.reduce((total, gasto) => total + gasto.montoTotal, 0);
};

// Función para cerrar la vista de gastos
const handleCloseGastosList = () => {
  setShowGastosList(false);
  setSelectedCategory('');
  setActiveSection('');
};





// Función para abrir el modal con categoría preseleccionada
const handleAddGastoByCategory = (categoria) => {
  setNuevoGasto({
    ...initialGasto,
    gasto: categoria, // Preseleccionar la categoría
    fechaGasto: obtenerFechaActual()
  });
  setShowForm(true);
  setError(null);
};

// Función para agrupar gastos por descripción del producto
const groupGastosByProduct = (gastos) => {
  return gastos.reduce((groups, gasto) => {
    const descripcion = gasto.descripcion;
    if (!groups[descripcion]) {
      groups[descripcion] = {
        descripcion,
        gastos: [],
        totalMonto: 0,
        totalCantidad: 0,
        tiposDeGasto: new Set()
      };
    }
    
    groups[descripcion].gastos.push(gasto);
    groups[descripcion].totalMonto += gasto.montoTotal;
    groups[descripcion].totalCantidad += parseFloat(gasto.cantidad);
    groups[descripcion].tiposDeGasto.add(gasto.tipoDeGasto);
    
    return groups;
  }, {});
};

// Función para obtener estadísticas de un producto
const getProductStats = (gastos) => {
  const costoPromedio = gastos.reduce((sum, gasto) => sum + gasto.costoUnidad, 0) / gastos.length;
  const fechaUltimaCompra = new Date(Math.max(...gastos.map(g => new Date(g.fechaGasto))));
  const totalCompras = gastos.length;
  
  return {
    costoPromedio,
    fechaUltimaCompra,
    totalCompras
  };
};




// Función para manejar cambios en filtros rápidos
const handleDateFilterChange = (filterType, days) => {
  setDateFilter(filterType);
  setCustomDateRange({ start: '', end: '', active: false });
  setExpandedProduct(null); // Cerrar detalles expandidos
};

// Función para manejar rango personalizado
const handleCustomDateRange = () => {
  if (customDateRange.start && customDateRange.end) {
    setDateFilter('custom');
    setCustomDateRange(prev => ({ ...prev, active: true }));
    setExpandedProduct(null); // Cerrar detalles expandidos
  }
};

// Función para obtener el texto descriptivo del rango activo
const getDateRangeText = () => {
  const today = new Date();
  
  switch (dateFilter) {
    case 'today':
      return `Hoy (${formatDate(today.toISOString())})`;
    case 'week':
      const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return `Últimos 7 días (${formatDate(weekStart.toISOString())} - ${formatDate(today.toISOString())})`;
    case 'month':
      const monthStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      return `Últimos 30 días (${formatDate(monthStart.toISOString())} - ${formatDate(today.toISOString())})`;
    case 'quarter':
      const quarterStart = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
      return `Últimos 90 días (${formatDate(quarterStart.toISOString())} - ${formatDate(today.toISOString())})`;
    case 'year':
      const yearStart = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
      return `Últimos 365 días (${formatDate(yearStart.toISOString())} - ${formatDate(today.toISOString())})`;
    case 'custom':
      return `${formatDate(customDateRange.start)} - ${formatDate(customDateRange.end)}`;
    default:
      return 'Todos los períodos';
  }
};

// Función principal para filtrar gastos por rango de fechas
const filterGastosByDateRange = (gastos) => {
  if (dateFilter === 'all') return gastos;
  
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Fin del día de hoy
  
  let startDate, endDate;
  
  if (dateFilter === 'custom' && customDateRange.active) {
    startDate = new Date(customDateRange.start);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(customDateRange.end);
    endDate.setHours(23, 59, 59, 999);
  } else {
    endDate = new Date(today);
    
    switch (dateFilter) {
      case 'today':
        startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'quarter':
        startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        startDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        return gastos;
    }
  }
  
  return gastos.filter(gasto => {
    const gastoDate = new Date(gasto.fechaGasto);
    return gastoDate >= startDate && gastoDate <= endDate;
  });
};

// Función auxiliar para limpiar filtros al cambiar de categoría
const handleSectionChangeWithFilter = (section, category) => {
  // Limpiar filtros al cambiar de sección
  setDateFilter('all');
  setCustomDateRange({ start: '', end: '', active: false });
  setExpandedProduct(null);
  
  // Llamar a tu función original
  handleSectionChange(section, category);
};




  if (!isLoaded || !isSignedIn) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Control de Gastos</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}


<GastosOverTimeChart 
  gastos={gastos}
  selectedRange={dateFilter} // usando el estado dateFilter que ya tienes
/>

{/* Tarjetas de secciones */}
<div className="container mx-auto p-4">
  <h2 className="text-2xl font-bold text-gray-800 mb-6">Control de Secciones</h2>
  
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {/* Tarjeta de Finanzas */}
    <div 
      onClick={() => handleSectionChange('finanzas', 'Financiero')}
      className="bg-white shadow-xl rounded-xl overflow-hidden transform hover:scale-105 transition-transform duration-300 cursor-pointer"
    >
      <div className="aspect-square p-6 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <i className="fa fa-dollar-sign text-4xl text-blue-500"></i>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">Finanzas</h3>
          <p className="text-gray-600 text-center text-sm">
            Gestión de ingresos y egresos, control de presupuesto y más.
          </p>
        </div>
        <div className="mt-6">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleAddGastoByCategory('Financiero');
            }}
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold flex items-center justify-center space-x-2"
          >
            <i className="fa fa-plus"></i>
            <span>Agregar Gasto</span>
          </button>
        </div>
      </div>
    </div>

    {/* Tarjeta de Producción */}
    <div 
      onClick={() => handleSectionChange('produccion', 'Producción')}
      className="bg-white shadow-xl rounded-xl overflow-hidden transform hover:scale-105 transition-transform duration-300 cursor-pointer"
    >
      <div className="aspect-square p-6 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <i className="fa fa-cogs text-4xl text-green-500"></i>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">Producción</h3>
          <p className="text-gray-600 text-center text-sm">
            Control de inventarios, planificación de producción y más.
          </p>
        </div>
        <div className="mt-6">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleAddGastoByCategory('Producción');
            }}
            className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold flex items-center justify-center space-x-2"
          >
            <i className="fa fa-plus"></i>
            <span>Agregar Gasto</span>
          </button>
        </div>
      </div>
    </div>

    {/* Tarjeta de Ventas */}
    <div 
      onClick={() => handleSectionChange('ventas', 'Ventas')}
      className="bg-white shadow-xl rounded-xl overflow-hidden transform hover:scale-105 transition-transform duration-300 cursor-pointer"
    >
      <div className="aspect-square p-6 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
            <i className="fa fa-chart-line text-4xl text-yellow-500"></i>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">Ventas</h3>
          <p className="text-gray-600 text-center text-sm">
            Gestión de ventas, estrategias y análisis de mercado.
          </p>
        </div>
        <div className="mt-6">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleAddGastoByCategory('Ventas');
            }}
            className="w-full bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 transition-colors font-semibold flex items-center justify-center space-x-2"
          >
            <i className="fa fa-plus"></i>
            <span>Agregar Gasto</span>
          </button>
        </div>
      </div>
    </div>

    {/* Tarjeta Administrativa */}
    <div 
      onClick={() => handleSectionChange('administrativo', 'Administración')}
      className="bg-white shadow-xl rounded-xl overflow-hidden transform hover:scale-105 transition-transform duration-300 cursor-pointer"
    >
      <div className="aspect-square p-6 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
            <i className="fa fa-building text-4xl text-purple-500"></i>
          </div>
          <h3 className="text-2xl font-bold text-gray-800">Administrativo</h3>
          <p className="text-gray-600 text-center text-sm">
            Gestión administrativa, organización de recursos y más.
          </p>
        </div>
        <div className="mt-6">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleAddGastoByCategory('Administración');
            }}
            className="w-full bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 transition-colors font-semibold flex items-center justify-center space-x-2"
          >
            <i className="fa fa-plus"></i>
            <span>Agregar Gasto</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

{/* Lista de gastos por categoría - VISTA UNIFICADA */}
{showGastosList && (
  <div className="bg-white shadow-xl rounded-lg border-2 border-gray-200 mb-8 animate-fadeIn">
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200 rounded-t-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold text-gray-800">
          📊 Gastos de {selectedCategory}
        </h3>
        <button
          onClick={handleCloseGastosList}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors font-medium"
        >
          ✕ Cerrar
        </button>
      </div>
      
      {/* Filtros de fecha */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Filtros rápidos */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 mr-2">📅 Período:</span>
            {[
              { key: 'today', label: '🔸 Hoy', days: 0 },
              { key: 'week', label: '📅 Esta Semana', days: 7 },
              { key: 'month', label: '🗓️ Este Mes', days: 30 },
              { key: 'year', label: '🗓️ Este Año', days: 365 },
              { key: 'all', label: '🌍 Todo', days: null }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => handleDateFilterChange(filter.key, filter.days)}
                className={`px-3 py-2 text-sm rounded-md font-medium transition-colors ${
                  dateFilter === filter.key
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          
          {/* Selector de rango personalizado */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm font-medium text-gray-700">🎯 Personalizado:</span>
            <input
              type="date"
              value={customDateRange.start}
              onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-gray-500">hasta</span>
            <input
              type="date"
              value={customDateRange.end}
              onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={() => handleCustomDateRange()}
              disabled={!customDateRange.start || !customDateRange.end}
              className="px-4 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              📊 Aplicar
            </button>
          </div>
        </div>
        
        {/* Información del filtro activo */}
        {(dateFilter !== 'all' || customDateRange.active) && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                📊 Mostrando gastos: <span className="font-semibold text-blue-600">{getDateRangeText()}</span>
              </span>
              <button
                onClick={() => {
                  setDateFilter('all');
                  setCustomDateRange({ start: '', end: '', active: false });
                }}
                className="text-sm text-gray-500 hover:text-red-600 transition-colors"
              >
                🗑️ Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

    <div className="p-6">
      {(() => {
        // Obtener gastos y aplicar filtros de fecha
        const allCategoryGastos = getGastosByCategory(selectedCategory);
        const categoryGastos = filterGastosByDateRange(allCategoryGastos);
        const totalCategory = getTotalByType(categoryGastos);

        if (categoryGastos.length === 0) {
          return (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-500 text-xl mb-6">No hay gastos registrados en esta categoría</p>
              <button
                onClick={() => {
                  handleCloseGastosList();
                  handleAddGastoByCategory(selectedCategory);
                }}
                className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold text-lg"
              >
                + Agregar Primer Gasto
              </button>
            </div>
          );
        }

        // Agrupar gastos por producto y calcular totales por tipo de gasto
        const productGroups = groupGastosByProduct(categoryGastos);
        const tiposDeGastoUnicos = [...new Set(categoryGastos.map(g => g.tipoDeGasto))].sort();

        return (
          <div className="space-y-6">
            {/* Resumen total */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-lg font-semibold text-gray-700">Total en {selectedCategory}</span>
                  <div className="text-sm text-gray-600">
                    {categoryGastos.length} registro(s) filtrado(s) de {allCategoryGastos.length} total(es) - {Object.keys(productGroups).length} producto(s) diferentes
                  </div>
                  {categoryGastos.length !== allCategoryGastos.length && (
                    <div className="text-xs text-blue-600 mt-1">
                      📊 Filtro activo: {getDateRangeText()}
                    </div>
                  )}
                </div>
                <span className="text-3xl font-bold text-blue-600">{formatCurrency(totalCategory)}</span>
              </div>
              
              {/* Resumen por tipo de gasto */}
              <div className="mt-4 pt-4 border-t border-blue-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {tiposDeGastoUnicos.map(tipo => {
                    const gastosPorTipo = categoryGastos.filter(g => g.tipoDeGasto === tipo);
                    const totalPorTipo = getTotalByType(gastosPorTipo);
                    return (
                      <div key={tipo} className="text-center">
                        <div className="text-sm font-medium text-gray-600">{tipo}</div>
                        <div className="text-lg font-bold text-green-600">{formatCurrency(totalPorTipo)}</div>
                        <div className="text-xs text-gray-500">{gastosPorTipo.length} item(s)</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Tabla unificada */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="text-xl font-bold text-gray-800">📋 Detalle por Producto</h4>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="text-left p-4 font-semibold text-gray-700">Producto</th>
                      <th className="text-center p-4 font-semibold text-gray-700">Cantidad Total</th>
                      <th className="text-center p-4 font-semibold text-gray-700">Costo Promedio</th>
                      {tiposDeGastoUnicos.map(tipo => (
                        <th key={tipo} className="text-center p-4 font-semibold text-gray-700 bg-blue-50">
                          {tipo}
                        </th>
                      ))}
                      <th className="text-center p-4 font-semibold text-gray-700 bg-green-50">Costo Total</th>
                      <th className="text-center p-4 font-semibold text-gray-700">Última Compra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(productGroups)
                      .sort(([,a], [,b]) => b.totalMonto - a.totalMonto)
                      .map(([descripcion, data]) => {
                        const stats = getProductStats(data.gastos);
                        
                        // Calcular totales por tipo de gasto para este producto
                        const totalesPorTipo = {};
                        tiposDeGastoUnicos.forEach(tipo => {
                          const gastosTipo = data.gastos.filter(g => g.tipoDeGasto === tipo);
                          totalesPorTipo[tipo] = getTotalByType(gastosTipo);
                        });

                        return (
                          <tr key={descripcion} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4">
                              <div className="font-semibold text-gray-900">{descripcion}</div>
                              <div className="text-xs text-gray-500">
                                {stats.totalCompras} compra(s) - Tipos: {Array.from(data.tiposDeGasto).join(', ')}
                              </div>
                            </td>
                            <td className="text-center p-4 font-semibold">
                              {data.totalCantidad}
                            </td>
                            <td className="text-center p-4 font-semibold">
                              {formatCurrency(stats.costoPromedio)}
                            </td>
                            {tiposDeGastoUnicos.map(tipo => (
                              <td key={tipo} className="text-center p-4 bg-blue-50">
                                <span className={`font-bold ${totalesPorTipo[tipo] > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                  {totalesPorTipo[tipo] > 0 ? formatCurrency(totalesPorTipo[tipo]) : '-'}
                                </span>
                              </td>
                            ))}
                            <td className="text-center p-4 bg-green-50">
                              <span className="text-lg font-bold text-green-600">
                                {formatCurrency(data.totalMonto)}
                              </span>
                            </td>
                        <td className="text-center p-4">
                                <div className="flex justify-center space-x-2">
                                  <button
                                    onClick={() => handleEditGasto(data.gastos[0])} // Usar el primer gasto del grupo
                                    className="p-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                    title="Editar"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => {
                                      // Confirmar y eliminar todos los gastos del producto
                                      if (window.confirm(`¿Estás seguro de eliminar todos los gastos de "${descripcion}"?`)) {
                                        data.gastos.forEach(gasto => handleDeleteGasto(gasto._id));
                                      }
                                    }}
                                    className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                                    title="Eliminar"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                          </tr>
                        );
                      })}
                  </tbody>
                  
                  {/* Fila de totales */}
                  <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                    <tr className="font-bold">
                      <td className="p-4 text-gray-800">TOTALES</td>
                      <td className="text-center p-4 text-gray-800">
                        {categoryGastos.reduce((sum, g) => sum + g.cantidad, 0)}
                      </td>
                      <td className="text-center p-4 text-gray-600">-</td>
                      {tiposDeGastoUnicos.map(tipo => {
                        const gastosTipo = categoryGastos.filter(g => g.tipoDeGasto === tipo);
                        const totalTipo = getTotalByType(gastosTipo);
                        return (
                          <td key={tipo} className="text-center p-4 bg-blue-100">
                            <span className="text-blue-700 font-bold">
                              {formatCurrency(totalTipo)}
                            </span>
                          </td>
                        );
                      })}
                      <td className="text-center p-4 bg-green-100">
                        <span className="text-xl font-bold text-green-700">
                          {formatCurrency(totalCategory)}
                        </span>
                      </td>
                      <td className="text-center p-4 text-gray-600">-</td>
                      <td className="text-center p-4">-</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
                      {/* Botón para agregar nuevo gasto */}
                      <div className="text-center pt-6 border-t border-gray-200">
                        <button
                          onClick={() => {
                            handleCloseGastosList();
                            handleAddGastoByCategory(selectedCategory);
                          }}
                          className="bg-green-500 text-white px-8 py-4 rounded-lg hover:bg-green-600 transition-colors font-bold text-lg shadow-lg"
                        >
                          ➕ Agregar Nuevo Gasto en {selectedCategory}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
      <button 
        onClick={() => setShowForm(true)}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg mb-6 transition-colors"
      >
        Agregar Nuevo Gasto
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-screen overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                {nuevoGasto._id ? 'Actualizar Gasto' : 'Agregar Nuevo Gasto'}
              </h3>

              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría de Gasto *
                  </label>
                  <select
                    value={nuevoGasto.gasto}
                    onChange={(e) => handleInputChange('gasto', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    required
                  >
                    <option value="">Seleccione una categoría</option>
                    <option value="Producción">Producción</option>
                    <option value="Ventas">Ventas</option>
                    <option value="Administración">Administración</option>
                    <option value="Financiero">Financiero</option>
                  </select>
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Gasto *
                  </label>
                  <select
                    value={nuevoGasto.tipoDeGasto}
                    onChange={(e) => handleInputChange('tipoDeGasto', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    required
                  >
                    <option value="">Seleccione un tipo</option>
                    <option value="Mano de obra">Mano de obra</option>
                    <option value="Materia prima">Materia prima</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha y Hora *
                      </label>
                      <input
                        type="datetime-local"
                        value={nuevoGasto.fechaGasto || obtenerFechaActual()}
                        onChange={(e) => handleInputChange('fechaGasto', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                        required
                      />
                    </div>
         
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción *
                  </label>
                  <input
                    type="text"
                    value={nuevoGasto.descripcion}
                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="Describe el gasto..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Costo por Unidad *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={nuevoGasto.costoUnidad}
                    onChange={(e) => handleInputChange('costoUnidad', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={nuevoGasto.cantidad}
                    onChange={(e) => handleInputChange('cantidad', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="1"
                    required
                  />
                </div>


                {nuevoGasto.costoUnidad && nuevoGasto.cantidad && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <span className="text-sm font-medium text-gray-700">
                      Total: {formatCurrency(parseFloat(nuevoGasto.costoUnidad) * parseFloat(nuevoGasto.cantidad))}
                    </span>
                  </div>
                )}
              </form>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={nuevoGasto._id ? handleUpdateGasto : handleAddGasto}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Procesando...' : (nuevoGasto._id ? 'Actualizar' : 'Agregar')}
                </button>
                <button
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-2 bg-gray-500 text-white font-semibold rounded-md hover:bg-gray-600 disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default GastoList;