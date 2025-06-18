import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api from '../services/api'; // Quitada la importación no usada
import SalesByCollaboratorChart from './graphics/SalesByCollaboratorChart';
import CollectionsByCollaboratorChart from './graphics/CollectionsByCollaboratorChart'; 
import ProductSalesAnalysisChart from './graphics/ProductSalesAnalysisChart';
import GestionPersonalDepartamentoChart from './graphics/GestionPersonalDepartamentoChart';


function Reportes() {
  const { getToken } = useAuth();
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cobros, setCobros] = useState([]);
const [registros, setRegistros] = useState([]); 
  const [pagosPorColaborador, setPagosPorColaborador] = useState({});
  const [expandedColaborador, setExpandedColaborador] = useState(null);
  const [totalVentasPorColaborador, setTotalVentasPorColaborador] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('ventas'); 
  const [currentPageVentas, setCurrentPageVentas] = useState(1);
  const [itemsPerPageVentas] = useState(10);
  const [pagosPaginacion, setPagosPaginacion] = useState({});
  const [currentPageProductos, setCurrentPageProductos] = useState(1);
  const [itemsPerPageProductos] = useState(10);

  const [selectedRange, setSelectedRange] = useState('month'); // Estado para gestionar el rango de tiempo seleccionado
const [registrosGestion, setRegistrosGestion] = useState([]);


  // Función para obtener ventas
  const fetchVentas = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setError('No estás autorizado');
        return;
      }

      const response = await api.get('/ventas', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1000 } // Solicitar muchos registros o todos
      });

      console.log('Respuesta completa de ventas:', response.data);

      // Manejar diferentes estructuras de respuesta
      let ventasArray = [];
      if (Array.isArray(response.data)) {
        ventasArray = response.data;
      } else if (response.data && Array.isArray(response.data.ventas)) {
        ventasArray = response.data.ventas;
      } else if (response.data && Array.isArray(response.data.data)) {
        ventasArray = response.data.data;
      } else {
        console.error('Formato de respuesta inesperado para ventas:', response.data);
        setVentas([]);
        return;
      }

      // Validar y normalizar fechas
      const ventasValidadas = ventasArray.map(venta => {
        const fechaVenta = new Date(venta.fechaVenta);
        if (isNaN(fechaVenta.getTime())) {
          return { ...venta, fechaVenta: new Date().toISOString() };
        }
        return venta;
      });

      setVentas(ventasValidadas);
    } catch (error) {
      console.error('Error al obtener ventas:', error);
      setError('Error al cargar ventas');
      setVentas([]);
    }
  }, [getToken]);


// Función para obtener cobros
const fetchCobros = useCallback(async () => {
  try {
    const token = await getToken();
    if (!token) {
      setError('No estás autorizado');
      return;
    }

    const response = await api.get('/cobros', {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 1000 } // Solicitar muchos registros o todos
    });

    console.log('Cobros recibidos:', response.data); // Para debugging

    // Manejar diferentes estructuras de respuesta
    let cobrosArray = [];
    if (Array.isArray(response.data)) {
      cobrosArray = response.data;
    } else if (response.data && Array.isArray(response.data.cobros)) {
      cobrosArray = response.data.cobros;
    } else {
      console.error('Formato de respuesta inesperado para cobros:', response.data);
      setCobros([]);
      return;
    }

    setCobros(cobrosArray);
  } catch (error) {
    console.error('Error al obtener cobros:', error);
    setError('Error al cargar cobros');
    setCobros([]);
  }
}, [getToken]);

const fetchGestionData = useCallback(async () => {
  try {
    const token = await getToken();
    const response = await api.get('/gestion-personal', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setRegistrosGestion(response.data || []); // Actualiza registrosGestion
    setRegistros(response.data || []); // Actualiza registros
  } catch (error) {
    console.error('Error al obtener datos de gestión:', error);
  }
}, [getToken]);

  useEffect(() => {
    fetchVentas(); // Llamamos a la función para obtener las ventas
    fetchCobros(); // Llamamos a la función para obtener los cobros
    fetchGestionData();
  }, [fetchVentas, fetchCobros,fetchGestionData]);

  // Funciones para la paginación local de ventas
  const goToNextPageVentas = () => {
    const totalPagesVentas = Math.ceil(ventas.length / itemsPerPageVentas);
    if (currentPageVentas < totalPagesVentas) {
      setCurrentPageVentas(currentPageVentas + 1);
    }
  };

  const goToPreviousPageVentas = () => {
    if (currentPageVentas > 1) {
      setCurrentPageVentas(currentPageVentas - 1);
    }
  };

const goToNextPageProductos = () => {
  const totalPagesProductos = Math.ceil(productos.length / itemsPerPageProductos);
  if (currentPageProductos < totalPagesProductos) {
    setCurrentPageProductos(currentPageProductos + 1);
  }
};

const goToPreviousPageProductos = () => {
  if (currentPageProductos > 1) {
    setCurrentPageProductos(currentPageProductos - 1);
  }
};



  // Función para obtener los datos paginados (paginación local)
  const getPaginatedData = (items, currentPage, itemsPerPage) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  // Obtener ventas paginadas (paginación local)
  const ventasPaginadas = getPaginatedData(ventas, currentPageVentas, itemsPerPageVentas);
  const totalPagesVentas = Math.ceil(ventas.length / itemsPerPageVentas);
// Obtener productos paginados
const productosPaginados = getPaginatedData(productos, currentPageProductos, itemsPerPageProductos);
const totalPagesProductos = Math.ceil(productos.length / itemsPerPageProductos);

  // Función para obtener productos
  const fetchProductos = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setError('No estás autorizado');
        return;
      }
  
      // Solicitar todos los productos
      const response = await api.get('/productos', {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { limit: 1000 } // Solicitar muchos registros o todos
      });
  
      // Verificar la estructura de la respuesta
      let productosArray = [];
      if (response.data && Array.isArray(response.data)) {
        productosArray = response.data;
      } else if (response.data && Array.isArray(response.data.productos)) {
        productosArray = response.data.productos;
      } else {
        console.error('Formato de respuesta inesperado para productos:', response.data);
      }
      
      setProductos(productosArray);
    } catch (error) {
      console.error('Error al obtener productos:', error);
      setError('Error al cargar productos');
    }
  }, [getToken]);

  // Función para calcular totales de ventas por colaborador
  const calcularTotalesPorColaborador = useCallback((ventasArray) => {
    const totales = ventasArray.reduce((acc, venta) => {
      const colaboradorId = venta.colaboradorId?._id;
      if (colaboradorId) {
        acc[colaboradorId] = (acc[colaboradorId] || 0) + Math.floor(venta.montoTotal);
      }
      return acc;
    }, {});

    setTotalVentasPorColaborador(totales);
  }, []);

  // Función para consolidar pagos por colaborador
  const consolidarPagosPorColaborador = useCallback((cobrosArray) => {
    const pagosTotales = cobrosArray.reduce((acc, cobro) => {
      const colaboradorId = cobro.colaboradorId?._id;
      if (colaboradorId) {
        if (!acc[colaboradorId]) {
          acc[colaboradorId] = {
            nombre: cobro.colaboradorId.nombre,
            montoPagado: 0,
            ultimaFecha: cobro.fechaPago
          };
        }
        acc[colaboradorId].montoPagado += cobro.montoPagado;
        // Mantener la fecha más reciente de pago
        if (new Date(cobro.fechaPago) > new Date(acc[colaboradorId].ultimaFecha)) {
          acc[colaboradorId].ultimaFecha = cobro.fechaPago;
        }
      }
      return acc;
    }, {});

    setPagosPorColaborador(pagosTotales);

    // Inicializar la paginación para los pagos de cada colaborador
    const paginacionInicial = {};
    Object.keys(pagosTotales).forEach(colaboradorId => {
      paginacionInicial[colaboradorId] = {
        currentPage: 1,
        itemsPerPage: 10
      };
    });
    setPagosPaginacion(paginacionInicial);
  }, []);

  // Cargar todos los datos
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchVentas(),
          fetchProductos(),
          fetchCobros(),
          fetchGestionData()
        ]);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('Error al cargar datos');
      } finally {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, [fetchVentas, fetchProductos, fetchCobros, fetchGestionData]);

  // Calcular totales cuando cambien las ventas
  useEffect(() => {
    if (ventas.length > 0) {
      calcularTotalesPorColaborador(ventas);
    }
  }, [ventas, calcularTotalesPorColaborador]);

  // Consolidar pagos cuando cambien los cobros
  useEffect(() => {
    if (cobros.length > 0) {
      consolidarPagosPorColaborador(cobros);
    }
  }, [cobros, consolidarPagosPorColaborador]);


  // Función para obtener los pagos paginados de un colaborador
  const getPaginatedPagosColaborador = (colaboradorId) => {
    if (!pagosPaginacion[colaboradorId]) return [];
    
    const cobrosFiltrados = cobros.filter(cobro => cobro.colaboradorId?._id === colaboradorId);
    const { currentPage, itemsPerPage } = pagosPaginacion[colaboradorId];
    
    return getPaginatedData(cobrosFiltrados, currentPage, itemsPerPage);
  };

  const goToPreviousPagePagos = (colaboradorId) => {
    if (!pagosPaginacion[colaboradorId]) return;
    
    if (pagosPaginacion[colaboradorId].currentPage > 1) {
      setPagosPaginacion({
        ...pagosPaginacion,
        [colaboradorId]: {
          ...pagosPaginacion[colaboradorId],
          currentPage: pagosPaginacion[colaboradorId].currentPage - 1
        }
      });
    }
  };

  // Funciones para la paginación local de pagos de colaboradores
  const goToNextPagePagos = (colaboradorId) => {
    if (!pagosPaginacion[colaboradorId]) return;
    
    const cobrosFiltrados = cobros.filter(cobro => cobro.colaboradorId?._id === colaboradorId);
    const totalPages = Math.ceil(cobrosFiltrados.length / pagosPaginacion[colaboradorId].itemsPerPage);
    
    if (pagosPaginacion[colaboradorId].currentPage < totalPages) {
      setPagosPaginacion({
        ...pagosPaginacion,
        [colaboradorId]: {
          ...pagosPaginacion[colaboradorId],
          currentPage: pagosPaginacion[colaboradorId].currentPage + 1
        }
      });
    }
  };

    // Toggle details function
  const toggleDetails = (colaboradorId) => {
    setExpandedColaborador(expandedColaborador === colaboradorId ? null : colaboradorId);
  };

  
  // Manejar el cambio en el rango de tiempo
const handleRangeChange = (eventOrValue) => {
  try {
    // Si es un evento del selector (select element)
    if (eventOrValue?.target?.value) {
      setSelectedRange(eventOrValue.target.value);
    } 
    // Si es un valor directo del componente
    else if (typeof eventOrValue === 'string') {
      setSelectedRange(eventOrValue);
    }
    // Para debugging
    console.log('Nuevo rango seleccionado:', eventOrValue?.target?.value || eventOrValue);
  } catch (error) {
    console.error('Error en handleRangeChange:', error);
  }
};
  
// Asegúrate de que las ventas incluyan la información del colaborador
const ventasConColaborador = ventas.map(venta => ({
  ...venta,
  colaborador: venta.colaboradorId?.nombre || 'Sin Asignar'
}));


  // Renderizar datos de carga o error
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 m-6">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="reportes-container p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Centralización de Reportes</h2>
      
      {/* Dashboard resumen - Ahora clickeable */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          className={`bg-white rounded-lg shadow p-6 border-l-4 ${activeView === 'ventas' ? 'border-blue-700 bg-blue-50' : 'border-blue-500'} cursor-pointer transition-all hover:shadow-lg`}
          onClick={() => setActiveView('ventas')}
        >
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total de Ventas</h3>
          <p className="text-3xl font-bold text-blue-600">
            S/ {ventas.reduce((total, venta) => total + Math.floor(venta.montoTotal || 0), 0)}
          </p>
          <p className="text-sm text-gray-500 mt-2">Registros: {ventas.length}</p>
          {activeView === 'ventas' && (
            <div className="mt-2 text-xs text-blue-600 flex items-center">
              <span className="mr-1">• Activo</span>
            </div>
          )}
        </div>
        
        <div 
          className={`bg-white rounded-lg shadow p-6 border-l-4 ${activeView === 'productos' ? 'border-green-700 bg-green-50' : 'border-green-500'} cursor-pointer transition-all hover:shadow-lg`}
          onClick={() => setActiveView('productos')}
        >
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Productos</h3>
          <p className="text-3xl font-bold text-green-600">{productos.length}</p>
          <p className="text-sm text-gray-500 mt-2">
            {productos.reduce((total, producto) => total + (producto.cantidadRestante || 0), 0)} disponibles
          </p>
          {activeView === 'productos' && (
            <div className="mt-2 text-xs text-green-600 flex items-center">
              <span className="mr-1">• Activo</span>
            </div>
          )}
        </div>

        <div 
          className={`bg-white rounded-lg shadow p-6 border-l-4 ${
            activeView === 'cobros' ? 'border-purple-700 bg-purple-50' : 'border-purple-500'
          } cursor-pointer transition-all hover:shadow-lg`}
          onClick={() => setActiveView('cobros')}
        >
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Cobros</h3>
          <p className="text-3xl font-bold text-purple-600">{Array.isArray(cobros) ? cobros.length : 0}</p>
          <p className="text-sm text-gray-500 mt-2">
            S/ {Array.isArray(cobros) 
              ? cobros.reduce((total, cobro) => total + Math.floor(cobro.montoPagado || 0), 0)
              : 0}
          </p>
          {activeView === 'cobros' && (
            <div className="mt-2 text-xs text-purple-600 flex items-center">
              <span className="mr-1">• Activo</span>
            </div>
          )}
        </div>

              <div 
                className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                  activeView === 'gestion' ? 'border-amber-700 bg-amber-50' : 'border-amber-500'
                } cursor-pointer transition-all hover:shadow-lg`}
                onClick={() => setActiveView('gestion')}
              >
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Gestión Personal</h3>
                <p className="text-3xl font-bold text-amber-600">{registros?.length || 0}</p>
                <p className="text-sm text-gray-500 mt-2">Registros de Personal</p>
                {activeView === 'gestion' && (
                  <div className="mt-2 text-xs text-amber-600 flex items-center">
                    <span className="mr-1">• Activo</span>
                  </div>
                )}
              </div>


      </div>

      {/* Vista condicional - Ventas */}
      {activeView === 'ventas' && (
        <div className="report-section mb-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Reporte de Ventas</h3>
          
          {/* Gráfico de ventas */}
    <div className="mb-8">
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedRange('week')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            selectedRange === 'week'
              ? 'bg-amber-500 text-white shadow-lg'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-amber-50'
          }`}
        >
          Esta Semana
        </button>
        <button
          onClick={() => setSelectedRange('month')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            selectedRange === 'month'
              ? 'bg-amber-500 text-white shadow-lg'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-amber-50'
          }`}
        >
          Este Mes
        </button>
        <button
          onClick={() => setSelectedRange('year')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            selectedRange === 'year'
              ? 'bg-amber-500 text-white shadow-lg'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-amber-50'
          }`}
        >
          Este Año
        </button>
        <button
          onClick={() => setSelectedRange('historical')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            selectedRange === 'historical'
              ? 'bg-amber-500 text-white shadow-lg'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-amber-50'
          }`}
        >
          Histórico
        </button>

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

      </div>
              <SalesByCollaboratorChart
        ventas={ventasConColaborador}
        selectedRange={selectedRange}
        />
                  </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-sm font-semibold text-gray-700 border-b">Producto</th>
                  <th className="px-4 py-2 text-sm font-semibold text-gray-700 border-b">Colaborador</th>
                  <th className="px-4 py-2 text-sm font-semibold text-gray-700 border-b">Cantidad</th>
                  <th className="px-4 py-2 text-sm font-semibold text-gray-700 border-b">Monto Total</th>
                  <th className="px-4 py-2 text-sm font-semibold text-gray-700 border-b">Estado de Pago</th>
                </tr>
              </thead>
              <tbody>
                {ventasPaginadas.map((venta) => (
                  <tr key={venta._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">{venta.productoId?.nombre || 'Desconocido'}</td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">{venta.colaboradorId?.nombre || 'Desconocido'}</td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">{venta.cantidad}</td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">S/ {Math.floor(venta.montoTotal)}</td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">{venta.estadoPago}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Controles de paginación para ventas (paginación local) */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Página {currentPageVentas} de {totalPagesVentas} (Total: {ventas.length} registros)
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={goToPreviousPageVentas} 
                disabled={currentPageVentas === 1}
                className={`px-3 py-1 rounded ${currentPageVentas === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
              >
                Anterior
              </button>
              <button 
                onClick={goToNextPageVentas} 
                disabled={currentPageVentas === totalPagesVentas}
                className={`px-3 py-1 rounded ${currentPageVentas === totalPagesVentas ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Vista condicional - Productos */}
      {activeView === 'productos' && (
        <div className="report-section mb-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Reporte de Inventario</h3>
        
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

        {/* Agregar el nuevo gráfico */}
      <div className="mb-8">
      <ProductSalesAnalysisChart 
        ventas={ventas} // Asegúrate que ventas tenga productoId.nombre
        selectedRange={selectedRange}
        onRangeChange={handleRangeChange}
      />  

      </div>
        
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-sm font-semibold text-gray-700 border-b">Producto</th>
                  <th className="px-4 py-2 text-sm font-semibold text-gray-700 border-b">Cantidad</th>
                  <th className="px-4 py-2 text-sm font-semibold text-gray-700 border-b">C.Vendida</th>
                  <th className="px-4 py-2 text-sm font-semibold text-gray-700 border-b">C.disponible</th>
                </tr>
              </thead>
              <tbody>
                {productosPaginados.map((producto) => (
                  <tr key={producto._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">{producto.nombre}</td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">{producto.cantidad}</td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">{producto.cantidadVendida}</td>
                    <td className="px-4 py-2 text-sm text-gray-600 border-b">{producto.cantidadRestante}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Controles de paginación para productos */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Página {currentPageProductos} de {totalPagesProductos} (Total: {productos.length} registros)
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={goToPreviousPageProductos} 
                disabled={currentPageProductos === 1}
                className={`px-3 py-1 rounded ${
                  currentPageProductos === 1 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                Anterior
              </button>
              <button 
                onClick={goToNextPageProductos} 
                disabled={currentPageProductos === totalPagesProductos}
                className={`px-3 py-1 rounded ${
                  currentPageProductos === totalPagesProductos 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Vista condicional - Cobros */}
      {activeView === 'cobros' && (     
     <div className="report-section mb-6">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">Reporte de Pagos</h3>
              
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

              <div className="mb-8">
                {cobros.length > 0 ? (
                  <CollectionsByCollaboratorChart 
                    cobros={cobros} 
                    selectedRange={selectedRange} 
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-lg text-gray-500">No hay datos de cobros disponibles</p>
                  </div>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700 border-b">Colaborador</th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700 border-b">Monto Pagado</th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700 border-b">Total Ventas</th>
                      <th className="px-4 py-2 text-sm font-semibold text-gray-700 border-b">Saldo Pendiente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(pagosPorColaborador).map(([colaboradorId, datos]) => (
                      <React.Fragment key={colaboradorId}>
                        <tr
                          onClick={() => toggleDetails(colaboradorId)}
                          style={{ cursor: 'pointer' }}
                          className={expandedColaborador === colaboradorId ? 'bg-blue-100' : 'hover:bg-gray-50'}
                        >
                          <td className="px-4 py-2 text-sm text-gray-600 border-b">
                            {expandedColaborador === colaboradorId ? '▼ ' : '▶ '}
                            {datos.nombre || 'Desconocido'}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600 border-b">S/ {Math.floor(datos.montoPagado)}</td>
                          <td className="px-4 py-2 text-sm text-gray-600 border-b">{totalVentasPorColaborador[colaboradorId] || 0}</td>
                          <td className="px-4 py-2 text-sm text-gray-600 border-b">
                            {Math.floor((totalVentasPorColaborador[colaboradorId] || 0) - datos.montoPagado)}
                          </td>
                        </tr>
                        {expandedColaborador === colaboradorId && pagosPaginacion[colaboradorId] && (
                          <tr>
                            <td colSpan="4">
                              <div className="payment-details p-4 mt-2 bg-gray-50 rounded-md">
                                <h4 className="text-lg font-semibold text-gray-700 mb-4">Detalle de Pagos</h4>
                                <table className="inner-table min-w-full table-auto border-collapse border border-gray-300">
                                  <thead className="bg-gray-200">
                                    <tr>
                                      <th className="px-4 py-2 text-sm font-semibold text-gray-700 border-b">Fecha</th>
                                      <th className="px-4 py-2 text-sm font-semibold text-gray-700 border-b">Monto</th>
                                      <th className="px-4 py-2 text-sm font-semibold text-gray-700 border-b">Estado</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {getPaginatedPagosColaborador(colaboradorId).map((cobro) => (
                                      <tr key={cobro._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 text-sm text-gray-600 border-b">
                                          {new Date(cobro.fechaPago).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-600 border-b">
                                        S/ {Math.floor(cobro.montoPagado)}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-600 border-b">{cobro.estadoPago}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                
                                {/* Controles de paginación para pagos de colaborador */}
                                {(() => {
                                  const cobrosFiltrados = cobros.filter(cobro => cobro.colaboradorId?._id === colaboradorId);
                                  const totalPages = Math.ceil(cobrosFiltrados.length / pagosPaginacion[colaboradorId].itemsPerPage);
                                  const currentPage = pagosPaginacion[colaboradorId].currentPage;
                                  
                                  return (
                                    <div className="flex justify-between items-center mt-4">
                                      <div className="text-sm text-gray-600">
                                        Página {currentPage} de {totalPages} (Total: {cobrosFiltrados.length} registros)
                                      </div>
                                      <div className="flex space-x-2">
                                        <button 
                                          onClick={() => goToPreviousPagePagos(colaboradorId)} 
                                          disabled={currentPage === 1}
                                          className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                                        >
                                          Anterior
                                        </button>
                                        <button 
                                          onClick={() => goToNextPagePagos(colaboradorId)} 
                                          disabled={currentPage === totalPages}
                                          className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                                        >
                                          Siguiente
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Total de colaboradores: {Object.keys(pagosPorColaborador).length}
              </div>
            </div>
      )}

{/* Vista condicional - Gestión Personal */}
{activeView === 'gestion' && (
  <div className="report-section mb-6">
    <h3 className="text-xl font-semibold text-gray-700 mb-4">Reporte de Gestión de Personal</h3>
    
    {/* Selector de tiempo con botones */}
    <div className="mb-8">
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedRange('week')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            selectedRange === 'week'
              ? 'bg-amber-500 text-white shadow-lg'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-amber-50'
          }`}
        >
          Esta Semana
        </button>
        <button
          onClick={() => setSelectedRange('month')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            selectedRange === 'month'
              ? 'bg-amber-500 text-white shadow-lg'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-amber-50'
          }`}
        >
          Este Mes
        </button>
        <button
          onClick={() => setSelectedRange('year')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            selectedRange === 'year'
              ? 'bg-amber-500 text-white shadow-lg'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-amber-50'
          }`}
        >
          Este Año
        </button>
        <button
          onClick={() => setSelectedRange('historical')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            selectedRange === 'historical'
              ? 'bg-amber-500 text-white shadow-lg'
              : 'bg-white text-gray-600 border border-gray-300 hover:bg-amber-50'
          }`}
        >
          Histórico
        </button>

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


      </div>

      {/* Análisis por Departamento */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="text-lg font-semibold text-gray-700 mb-4">
          Análisis por Departamento
        </h4>
        <GestionPersonalDepartamentoChart 
          registros={registrosGestion}
          selectedRange={selectedRange}
        />
      </div>
    </div>
  </div>
)}




    </div>
  );
}

export default Reportes;