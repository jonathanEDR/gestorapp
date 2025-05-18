import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api from '../services/api'; // Ajusta la ruta si es necesario
import VentasChart from './graphics/VentasChart'; // Importar el nuevo gráfico de ventas

function Reportes() {
  const { getToken } = useAuth();
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cobros, setCobros] = useState([]);
  const [pagosPorColaborador, setPagosPorColaborador] = useState({});
  const [expandedColaborador, setExpandedColaborador] = useState(null);
  
  const [totalVentasPorColaborador, setTotalVentasPorColaborador] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Nuevo estado para controlar qué vista mostrar
  const [activeView, setActiveView] = useState('ventas'); // 'ventas' o 'productos'

  // Estados para la paginación local (frontend) de ventas
  const [currentPageVentas, setCurrentPageVentas] = useState(1);
  const [itemsPerPageVentas] = useState(10);
  const [pagosPaginacion, setPagosPaginacion] = useState({});
  const [currentPageProductos, setCurrentPageProductos] = useState(1);
  const [itemsPerPageProductos] = useState(10);

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


  // Cargar los datos de las ventas
  useEffect(() => {
    const fetchVentas = async () => {
      try {
        const token = await getToken();
        if (!token) {
          setError('No estás autorizado');
          setIsLoading(false);
          return;
        }

        const response = await api.get('/ventas', {
          headers: { 'Authorization': `Bearer ${token}` },
          params: { limit: 1000 } // Solicitar muchos registros o todos (depende de la API)
        });

        let ventasArray = [];
        if (response.data && Array.isArray(response.data)) {
          ventasArray = response.data;
        } else if (response.data && Array.isArray(response.data.ventas)) {
          ventasArray = response.data.ventas;
        } else {
          setError('Formato de respuesta inesperado');
          setIsLoading(false);
          return;
        }

        ventasArray = ventasArray.map(venta => {
          const fechaVenta = new Date(venta.fechaVenta);
          if (isNaN(fechaVenta.getTime())) {
            return { ...venta, fechaVenta: new Date().toISOString() };
          }
          return venta;
        });

        setVentas(ventasArray);

        // Calcular el total de ventas por colaborador
        const totales = ventasArray.reduce((acc, venta) => {
          const colaboradorId = venta.colaboradorId?._id;
          if (colaboradorId) {
            acc[colaboradorId] = (acc[colaboradorId] || 0) + Math.floor(venta.montoTotal);
          }
          return acc;
        }, {});

        setTotalVentasPorColaborador(totales);
      } catch (error) {
        console.error('Error al obtener ventas:', error);
        setError('Error al cargar ventas');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchProductos = async () => {
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
    };

        const fetchCobros = async () => {
      try {
        const token = await getToken();
        if (!token) {
          setError('No estás autorizado');
          return;
        }

        // Solicitar todos los cobros
        const response = await api.get('/cobros', {
          headers: { 'Authorization': `Bearer ${token}` },
          params: { limit: 1000 } // Solicitar muchos registros o todos
        });

        // Verificar la estructura de la respuesta
        let cobrosArray = [];
        if (response.data && Array.isArray(response.data)) {
          cobrosArray = response.data;
        } else if (response.data && Array.isArray(response.data.cobros)) {
          cobrosArray = response.data.cobros;
        } else {
          console.error('Formato de respuesta inesperado para cobros:', response.data);
        }
        
        setCobros(cobrosArray);

        // Consolidar pagos por colaborador
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
      } catch (error) {
        console.error('Error al obtener cobros:', error);
        setError('Error al cargar cobros');
      }
    };

    fetchVentas();
    fetchProductos();
    fetchCobros();
  }, [getToken]);


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

      </div>

      {/* Vista condicional - Ventas */}
      {activeView === 'ventas' && (
        <div className="report-section mb-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Reporte de Ventas</h3>
          
          {/* Gráfico de ventas */}
          <div className="mb-8">
            <VentasChart ventas={ventas} />
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

      {activeView === 'cobros' && (      <div className="report-section mb-6">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">Reporte de Pagos</h3>
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
    </div>
  );
}

export default Reportes;