import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api, { ventasAPI } from '../services/api';
import SalesOverTimeChart from './graphics/SalesOverTimeChart';
import VentaModal from './components/VentaModal';
import DevolucionModal from './components/DevolucionModal';
import DevolucionesList from './DevolucionesList';

function VentaList() {
  const { getToken } = useAuth();
  
  // Estados principales
  const [ventas, setVentas] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
    // Estados de UI
  const [selectedRange, setSelectedRange] = useState('month');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [ventasVisibles, setVentasVisibles] = useState(10); // Mostrar 10 ventas inicialmente

  // Estados para devoluciones
  const [processingDevolucion, setProcessingDevolucion] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [showDevolucionModal, setShowDevolucionModal] = useState(false);
  const [devoluciones, setDevoluciones] = useState([]);

  // Función principal para cargar todos los datos
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getToken();
      if (!token) {
        throw new Error('No autorizado');
      }

      // Cargar todos los datos en paralelo con timeouts
      const [ventasResponse, colaboradoresResponse, productosResponse] = await Promise.all([
        api.get('/ventas', { 
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 50 }, // Limitar ventas iniciales
          timeout: 8000
        }),
        api.get('/ventas/colaboradores', { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        }),
        api.get('/ventas/productos', { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        })
      ]);

      // Procesar ventas
      let ventasData = [];
      if (Array.isArray(ventasResponse.data)) {
        ventasData = ventasResponse.data;
      } else if (ventasResponse.data.ventas && Array.isArray(ventasResponse.data.ventas)) {
        ventasData = ventasResponse.data.ventas;
      }      // Ordenar ventas por fecha descendente
      ventasData.sort((a, b) => new Date(b.fechaVenta || b.fechadeVenta) - new Date(a.fechaVenta || a.fechadeVenta));

      // Actualizar estados
      setVentas(ventasData);
      setColaboradores(colaboradoresResponse.data || []);
      setProductos(productosResponse.data || []);

      console.log('Datos cargados exitosamente:', {
        ventas: ventasData.length,
        colaboradores: colaboradoresResponse.data?.length || 0,
        productos: productosResponse.data?.length || 0
      });

    } catch (error) {
      console.error('Error al cargar los datos:', error);
      setError(error.message || 'Error al cargar los datos');
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [getToken]);
  // Cargar devoluciones por separado con límites optimizados
  const loadDevoluciones = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getToken();
      if (!token) return;

      console.log('🔍 DEBUG loadDevoluciones: Iniciando carga de devoluciones...');

      // CARGAR DEVOLUCIONES CON LÍMITE RAZONABLE
      const response = await api.get('/ventas/devoluciones', {
        params: { page: 1, limit: 50 }, // Límite más razonable
        headers: { Authorization: `Bearer ${token}` },
        timeout: 8000 // Timeout de 8 segundos
      });

      console.log('🔍 DEBUG loadDevoluciones: Respuesta recibida:', response.data);

      const devolucionesRecibidas = response.data.devoluciones || [];
      console.log('🔍 DEBUG loadDevoluciones: Total devoluciones recibidas:', devolucionesRecibidas.length);

      setDevoluciones(devolucionesRecibidas);
      console.log('🔍 DEBUG loadDevoluciones: Estado actualizado con', devolucionesRecibidas.length, 'devoluciones');
    } catch (error) {
      console.error('❌ Error al cargar devoluciones en loadDevoluciones:', error);
      if (error.code === 'ECONNABORTED') {
        setError('Timeout: La consulta está tardando demasiado. Intenta recargar.');
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [getToken]);  // Effect principal para cargar datos iniciales
  useEffect(() => {
    fetchData();
    loadDevoluciones();
  }, [fetchData, loadDevoluciones]);

  // Effect para monitorear cambios en el estado de devoluciones
  useEffect(() => {
    console.log('🔍 DEBUG: Estado de devoluciones actualizado:', {
      cantidad: devoluciones.length,
      devoluciones: devoluciones.slice(0, 3) // Solo las primeras 3 para no saturar logs
    });
    
    // Mostrar todos los ventaIds únicos en las devoluciones
    if (devoluciones.length > 0) {
      const ventaIds = devoluciones.map(dev => dev.ventaId?._id || dev.ventaId);
      const ventaIdsUnicos = [...new Set(ventaIds)];
      console.log('🔍 DEBUG: VentaIds únicos en devoluciones:', ventaIdsUnicos.slice(0, 10)); // Solo los primeros 10
    }
  }, [devoluciones]);

  // Effect para monitorear cambios en el estado de devoluciones
  useEffect(() => {
    console.log('🔍 DEBUG useEffect: Estado de devoluciones cambió:', {
      cantidad: devoluciones.length,
      devoluciones: devoluciones
    });
  }, [devoluciones]);
  // Función para cargar devoluciones secundaria con optimizaciones
  const loadDevolucionesSecondary = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      console.log('🔍 DEBUG loadDevolucionesSecondary: Iniciando carga secundaria de devoluciones...');
      
      // CARGAR DEVOLUCIONES CON LÍMITE OPTIMIZADO
      const response = await api.get('/ventas/devoluciones', {
        params: { page: 1, limit: 50 }, // Límite más razonable
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 8000 // Timeout de 8 segundos
      });

      console.log('🔍 DEBUG loadDevolucionesSecondary: Respuesta completa:', response.data);

      let devolucionesProcesadas = [];
      if (response.data && Array.isArray(response.data.devoluciones)) {
        devolucionesProcesadas = response.data.devoluciones;
        console.log('🔍 DEBUG loadDevolucionesSecondary: Usando response.data.devoluciones');
      } else if (Array.isArray(response.data)) {
        devolucionesProcesadas = response.data;
        console.log('🔍 DEBUG loadDevolucionesSecondary: Usando response.data directamente');
      }

      console.log('🔍 DEBUG loadDevolucionesSecondary: Total devoluciones procesadas:', devolucionesProcesadas.length);
      
      setDevoluciones(devolucionesProcesadas);
      console.log('🔍 DEBUG loadDevolucionesSecondary: Estado actualizado con', devolucionesProcesadas.length, 'devoluciones');
    } catch (error) {
      console.error('❌ Error detallado al cargar devoluciones en loadDevolucionesSecondary:', {
        mensaje: error.message,
        respuesta: error.response?.data,
        status: error.response?.status
      });
      
      if (error.code === 'ECONNABORTED') {
        setError('Timeout: La consulta está tardando demasiado. Intenta recargar.');
      } else {
        setError(error.message || 'Error al cargar las devoluciones');
      }
    } finally {
      setLoading(false);
    }
  }, [getToken]);
  // Memos optimizados
  const salesChartComponent = useMemo(() => {
    if (!Array.isArray(ventas) || ventas.length === 0) {
      return (
        <div className="mb-8 p-4 bg-gray-100 rounded-lg text-center">
          <p className="text-gray-600">No hay datos de ventas para mostrar</p>
        </div>
      );
    }
      return (
      <div className="mb-8">
        <SalesOverTimeChart
          ventas={ventas}
          devoluciones={devoluciones}
          selectedRange={selectedRange}
        />
      </div>
    );
  }, [ventas, devoluciones, selectedRange]);
  const handleSaveVenta = async (ventaPayload) => {
    try {
      setIsSaving(true);
      const token = await getToken();
      
      if (!token) {
        throw new Error('No autorizado');
      }

      console.log('Payload recibido:', ventaPayload); // Debug

      // Validar el payload antes de enviarlo
      if (!ventaPayload.colaboradorId) {
        throw new Error('Colaborador no especificado');
      }

      if (!ventaPayload.detalles || !Array.isArray(ventaPayload.detalles) || ventaPayload.detalles.length === 0) {
        throw new Error('No hay productos en la venta');
      }

      // Validar cada detalle y agregar el nombre del producto
      const detallesConNombre = ventaPayload.detalles.map(detalle => {
        if (!detalle.productoId) {
          throw new Error('Producto no especificado');
        }
        if (!detalle.cantidad || detalle.cantidad <= 0) {
          throw new Error(`Cantidad inválida en el producto`);
        }
        if (!detalle.precioUnitario || detalle.precioUnitario <= 0) {
          throw new Error(`Precio inválido en el producto`);
        }

        const producto = productos.find(p => p._id === detalle.productoId);
        if (!producto) {
          throw new Error(`Producto no encontrado en el inventario`);
        }

        return {
          ...detalle,
          nombre: producto.nombre
        };
      });

      // Crear el payload final con los nombres incluidos
      const ventaPayloadCompleto = {
        ...ventaPayload,
        detalles: detallesConNombre,
        fechaVenta: ventaPayload.fechaVenta || new Date().toISOString() // Usar fechaVenta
      };

      console.log('Payload a enviar:', ventaPayloadCompleto); // Debug

      const response = await api.post('/ventas', ventaPayloadCompleto, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Respuesta del servidor:', response.data); // Debug

      if (response.data) {
        // Actualizar el estado local inmediatamente con la nueva venta
        setVentas(prevVentas => {
          const newVentas = Array.isArray(prevVentas) ? [...prevVentas] : [];
          // Agregar la nueva venta al principio para que aparezca primero
          newVentas.unshift({
            ...response.data,
            fechaVenta: response.data.fechaVenta || response.data.fechadeVenta || new Date().toISOString()
          });
          // Reordenar por fecha descendente
          return newVentas.sort((a, b) => new Date(b.fechaVenta || b.fechadeVenta) - new Date(a.fechaVenta || a.fechadeVenta));
        });

        toast.success('Venta creada exitosamente');
        handleCloseModal();

        // Recargar los datos para asegurar sincronización (opcional, ya actualizamos el estado)
        setTimeout(() => {
          fetchData();
        }, 1000);
      }
    } catch (error) {
      console.error('Error al guardar la venta:', error);
      console.error('Error detallado:', {
        mensaje: error.message,
        respuesta: error.response?.data,
        stack: error.stack
      });
      const errorMessage = error.response?.data?.message || error.message || 'Error al procesar la venta';
      toast.error(`Error al guardar la venta: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };
  const handleOpenModal = () => {
    setIsModalVisible(true);
  };  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  // Función para mostrar más ventas
  const handleVerMasVentas = () => {
    setVentasVisibles(prev => prev + 20);
  };

  // Función para abrir el modal de devolución (ahora con useCallback para evitar warning)
  const abrirModalDevolucion = useCallback((venta) => {
    setVentaSeleccionada(venta);
    setShowDevolucionModal(true);
  }, []);  // Función para obtener devoluciones por venta
  const getDevolucionesPorVenta = useCallback((venta) => {
    if (!venta || !Array.isArray(devoluciones)) {
      console.log('🔍 DEBUG getDevolucionesPorVenta: Sin venta o devoluciones no es array:', { venta: !!venta, devoluciones: Array.isArray(devoluciones) });
      return [];
    }

    console.log('🔍 DEBUG getDevolucionesPorVenta: Buscando devoluciones para venta:', venta._id);
    console.log('🔍 DEBUG getDevolucionesPorVenta: Total devoluciones disponibles:', devoluciones.length);
    
    // Debug: Mostrar una muestra de devoluciones para ver la estructura
    if (devoluciones.length > 0) {
      console.log('🔍 DEBUG: Muestra de devolución:', {
        devolucion: devoluciones[0],
        ventaId: devoluciones[0].ventaId,
        ventaIdType: typeof devoluciones[0].ventaId,
        ventaIdValue: devoluciones[0].ventaId?._id || devoluciones[0].ventaId
      });
    }
    
    // Debug: Mostrar datos de la venta
    console.log('🔍 DEBUG: Datos de venta:', {
      ventaId: venta._id,
      ventaIdType: typeof venta._id
    });

    const devolucionesFiltradas = devoluciones.filter(dev => {
      const devVentaId = dev.ventaId?._id || dev.ventaId;
      const ventaId = venta._id;
      
      // Convertir ambos a string para comparación segura
      const devVentaIdStr = String(devVentaId);
      const ventaIdStr = String(ventaId);
      
      const match = devVentaIdStr === ventaIdStr;

      // Log detallado solo para las primeras comparaciones
      if (devoluciones.indexOf(dev) < 3) {
        console.log(`🔍 DEBUG comparación ${devoluciones.indexOf(dev)}:`, {
          devVentaId: devVentaIdStr,
          ventaId: ventaIdStr,
          match: match
        });
      }

      return match;
    });

    console.log(`🔍 DEBUG getDevolucionesPorVenta: Encontradas ${devolucionesFiltradas.length} devoluciones para venta ${venta._id}`);
    return devolucionesFiltradas;
  }, [devoluciones]);
  // Memo para manejar ventas de forma segura
  const ventasSeguras = useMemo(() => {
    if (!Array.isArray(ventas)) return [];
    
    // Tomar solo las ventas visibles (paginación en frontend)
    const ventasParaMostrar = ventas.slice(0, ventasVisibles);
    
    console.log('🔍 DEBUG: Total ventas:', ventas.length);
    console.log('🔍 DEBUG: Ventas visibles configuradas:', ventasVisibles);
    console.log('🔍 DEBUG: Ventas a mostrar:', ventasParaMostrar.length);
    
    return ventasParaMostrar.map(venta => ({
      ...venta,
      detalles: Array.isArray(venta.detalles) ? venta.detalles : [],
      colaboradorId: venta.colaboradorId || { nombre: 'N/A' },
      montoTotal: venta.montoTotal || 0,
      estadoPago: venta.estadoPago || 'Pendiente'
    }));
  }, [ventas, ventasVisibles]);// Función para procesar una devolución
  const handleProcesarDevolucion = async (devolucionData) => {
    try {
      setProcessingDevolucion(true);
      const token = await getToken();

      console.log('Intentando procesar devolución:', devolucionData); // Debug log

      // Validar datos necesarios
      if (!devolucionData.ventaId || !devolucionData.items || devolucionData.items.length === 0) {
        throw new Error('Datos de devolución incompletos');
      }

      // Enviar toda la devolución en una sola petición
      const payload = {
        ventaId: devolucionData.ventaId,
        fechaDevolucion: devolucionData.fechaDevolucion || new Date().toISOString(),
        items: devolucionData.items.map(item => ({
          productoId: item.productoId,
          cantidadDevuelta: item.cantidadDevuelta,
          montoDevolucion: item.montoDevolucion,
          motivo: item.motivo || 'Sin motivo especificado'
        }))
      };

      console.log('Payload de devolución enviado:', payload);

      const response = await api.post('/ventas/devoluciones', payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Respuesta de devolución:', response.data);

      // Recargar datos
      await Promise.all([fetchData(), loadDevolucionesSecondary()]);

      toast.success(response.data.message || 'Devolución procesada exitosamente');
    } catch (error) {
      console.error('Error al procesar devolución:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al procesar la devolución';
      toast.error(errorMessage);
      throw error;    } finally {
      setProcessingDevolucion(false);
    }
  };

  // Función para eliminar una venta
  const handleEliminarVenta = useCallback(async (ventaId) => {
    if (!ventaId) {
      toast.error('ID de venta no válido');
      return;
    }

    if (!window.confirm('¿Está seguro que desea eliminar esta venta? Esta acción no se puede deshacer.')) {
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      
      if (!token) {
        throw new Error('No autorizado - token no válido');
      }

      console.log('Iniciando eliminación de venta:', ventaId);

      // Eliminar la venta directamente sin obtenerla primero
      await ventasAPI.eliminarVenta(ventaId, token);

      console.log('Venta eliminada exitosamente');

      // Actualizar el estado local inmediatamente
      setVentas(prevVentas => prevVentas.filter(v => v._id !== ventaId));
      
      // Mostrar mensaje de éxito
      toast.success('Venta eliminada correctamente y stock actualizado');
        // Recargar datos para asegurar sincronización
      await Promise.all([
        fetchData(),
        loadDevolucionesSecondary()
      ]);
      
    } catch (error) {
      console.error('Error detallado al eliminar la venta:', {
        ventaId,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      // Manejar diferentes tipos de errores
      let errorMessage = 'Error desconocido al eliminar la venta';
      
      if (error.response?.status === 404) {
        errorMessage = 'La venta ya no existe en el sistema';
        // Actualizar UI quitando la venta del estado local
        setVentas(prevVentas => prevVentas.filter(v => v._id !== ventaId));
        toast.info(errorMessage);
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'No se puede eliminar la venta';
        toast.error(errorMessage);
      } else if (error.response?.status === 401) {
        errorMessage = 'No autorizado para realizar esta acción';
        toast.error(errorMessage);
      } else {
        errorMessage = error.response?.data?.message || error.message || 'Error al eliminar la venta';
        toast.error(errorMessage);
      }
        // Recargar datos en caso de error para mantener sincronización
      try {
        await fetchData();
      } catch (reloadError) {
        console.error('Error al recargar ventas después del error:', reloadError);
      }
    } finally {
      setLoading(false);
    }
  }, [getToken, fetchData, loadDevolucionesSecondary]);
  // Componente TableRow optimizado con React.memo
  const TableRow = React.memo(({ venta, onDevolucion, onEliminar, productos, devoluciones }) => {
    const formatearFecha = useCallback((fecha) => {
      if (!fecha) return '';
      try {
        const fechaObj = new Date(fecha);
        return fechaObj.toLocaleString('es-PE', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      } catch (error) {
        return 'Fecha inválida';
      }
    }, []);

    const handleEliminarClick = useCallback((e) => {
      e.preventDefault();
      e.stopPropagation();
      if (venta && venta._id) {
        console.log('Iniciando eliminación de venta:', venta._id);
        onEliminar(venta._id);
      } else {
        console.error('Venta inválida:', venta);
        toast.error('Error: Venta no válida');
      }
    }, [venta, onEliminar]);

    const handleDevolucionClick = useCallback((e) => {
      e.preventDefault();
      e.stopPropagation();
      onDevolucion(venta);
    }, [venta, onDevolucion]);    const renderDevoluciones = useMemo(() => {
      if (!devoluciones || !Array.isArray(devoluciones) || devoluciones.length === 0) {
        return <span className="text-gray-400 text-sm">Sin devoluciones</span>;
      }

      const totalDevolucionesAmount = devoluciones.reduce((total, dev) => {
        return total + (dev.montoDevolucion || 0);
      }, 0);

      const totalDevolucionesCantidad = devoluciones.reduce((total, dev) => {
        return total + (dev.cantidadDevuelta || 0);
      }, 0);

      return (
        <div className="text-sm">
          <div className="font-medium text-orange-600">
            {devoluciones.length} devolución(es)
          </div>
          <div className="text-xs text-gray-600">
            {totalDevolucionesCantidad} items
          </div>
          <div className="text-xs font-medium text-gray-700">
            S/ {totalDevolucionesAmount.toFixed(2)}
          </div>
        </div>
      );
    }, [devoluciones]);// Calcular monto total real después de devoluciones
    const calcularMontoReal = useMemo(() => {
      // Si existe venta.totalOriginal, usarlo como referencia
      const totalOriginal = venta.totalOriginal !== undefined ? venta.totalOriginal : venta.montoTotal;
      if (!devoluciones || devoluciones.length === 0) {
        return totalOriginal || 0;
      }
      // Sumar todos los montos de devoluciones para esta venta
      const totalDevoluciones = devoluciones.reduce((total, dev) => {
        return total + (dev.montoDevolucion || 0);
      }, 0);
      // Si el total original es igual al monto actual, restar devoluciones
      if (venta.totalOriginal !== undefined) {
        return totalOriginal - totalDevoluciones;
      } else {
        // Si solo tienes montoTotal y ya está actualizado, no restes devoluciones de nuevo
        return totalOriginal;
      }
    }, [venta.montoTotal, venta.totalOriginal, devoluciones]);

    const renderDetallesProductos = useMemo(() => {
      if (!venta.detalles || !Array.isArray(venta.detalles)) {
        return <span className="text-gray-400">Sin detalles</span>;
      }

      return (
        <div className="space-y-1">
          {venta.detalles.map((detalle, index) => {
            // Calcular cantidad devuelta para este producto específico
            const cantidadDevueltaProducto = devoluciones
              .filter(dev => {
                const devProductoId = dev.productoId?._id || dev.productoId;
                const detalleProductoId = detalle.productoId?._id || detalle.productoId;
                return devProductoId === detalleProductoId;
              })
              .reduce((total, dev) => total + (dev.cantidadDevuelta || 0), 0);

            // Cantidad real = cantidad original - cantidad devuelta
            const cantidadReal = detalle.cantidad - cantidadDevueltaProducto;
            const nombreProducto = detalle.nombre || detalle.productoId?.nombre || 'Producto';            return (
              <div key={detalle._id || index} className="text-sm">
                {cantidadDevueltaProducto > 0 ? (
                  // Mostrar cantidad con devoluciones (más compacto)
                  <div>
                    <div className="font-medium text-green-700">
                      {cantidadReal}x {nombreProducto}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="line-through">Orig: {detalle.cantidad}</span>
                      <span className="text-red-600 ml-1">Dev: {cantidadDevueltaProducto}</span>
                    </div>
                  </div>
                ) : (
                  // Mostrar cantidad normal sin devoluciones
                  <div>
                    <span>{detalle.cantidad}x {nombreProducto}</span>
                    {detalle.precioUnitario && (
                      <span className="text-gray-600 ml-1 text-xs">(S/ {detalle.precioUnitario.toFixed(2)})</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }, [venta.detalles, devoluciones]);    return (
      <tr className="hover:bg-gray-50 border-b">
        <td className="px-4 py-2 text-sm">{formatearFecha(venta.fechaVenta || venta.fechadeVenta)}</td>
        <td className="px-4 py-2 text-sm">{venta.colaboradorId?.nombre || 'N/A'}</td>
        <td className="px-4 py-2">{renderDetallesProductos}</td>
        <td className="px-4 py-2 font-semibold text-sm">
          {devoluciones && devoluciones.length > 0 ? (
            <div>
              <div className="text-green-700">S/ {calcularMontoReal.toFixed(2)}</div>
              {venta.totalOriginal !== undefined && (
                <div className="text-xs text-gray-400 line-through">
                  S/ {venta.totalOriginal.toFixed(2)}
                </div>
              )}
              {venta.totalOriginal === undefined && devoluciones.length > 0 && (
                <div className="text-xs text-gray-400 line-through">
                  S/ {(venta.montoTotal + devoluciones.reduce((total, dev) => total + (dev.montoDevolucion || 0), 0)).toFixed(2)}
                </div>
              )}
            </div>
          ) : (
            <span>S/ {(venta.montoTotal || 0).toFixed(2)}</span>
          )}
        </td>
        <td className="px-4 py-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            venta.estadoPago === 'Pagado' 
              ? 'bg-green-100 text-green-800' 
              : venta.estadoPago === 'Parcial'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {venta.estadoPago || 'Pendiente'}
          </span>
        </td>
        <td className="px-4 py-2">{renderDevoluciones}</td>
        <td className="px-4 py-2">
          <div className="flex space-x-2">
            <button
              onClick={handleDevolucionClick}
              className="text-blue-500 hover:text-blue-700 text-sm px-2 py-1"
            >
              Devolver
            </button>
            <button
              onClick={handleEliminarClick}
              className="text-red-500 hover:text-red-700 text-sm px-2 py-1"
            >
              Eliminar
            </button>
          </div>
        </td>
      </tr>
    );
  });

  // Renderizado de la tabla
  const renderTablaVentas = useCallback(() => {
    if (loading) {
      return (
        <div className="w-full text-center py-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-4 text-red-600">
          <p>{error}</p>
          <button 
            onClick={() => {
              setError(null);
              fetchData();
            }}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reintentar
          </button>
        </div>
      );
    }

    if (!ventas || ventas.length === 0) {
      return (
        <div className="text-center py-4 text-gray-600">
          <p>No hay datos de ventas para mostrar en el período seleccionado</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Fecha</th>
              <th className="px-4 py-2 text-left">Colaborador</th>
              <th className="px-4 py-2 text-left">Productos</th>
              <th className="px-4 py-2 text-left">Total</th>
              <th className="px-4 py-2 text-left">Estado</th>
              <th className="px-4 py-2 text-left">Devoluciones</th>
              <th className="px-4 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventasSeguras.map((venta) => (
              <TableRow
                key={venta._id}
                venta={venta}
                onDevolucion={abrirModalDevolucion}
                onEliminar={handleEliminarVenta}
                productos={productos}
                devoluciones={getDevolucionesPorVenta(venta)}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  }, [loading, error, ventas, ventasSeguras, productos, handleEliminarVenta, abrirModalDevolucion, getDevolucionesPorVenta, fetchData]);

  // En el return principal del componente, reemplazar la sección de la tabla por:
  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer />
      {/* Encabezado y botones */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Ventas</h1>
      
      </div>

      {/* Panel de Gráficos */}
      <div className="mb-8 relative overflow-hidden bg-white rounded-lg shadow">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Análisis de Ventas</h2>
            <select
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
              className="mt-1 block w-48 pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="day">Hoy</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mes</option>
              <option value="year">Este Año</option>
              <option value="historical">Histórico</option>
            </select>
          </div>
          {salesChartComponent}
        </div>
      </div>
  <button
          onClick={handleOpenModal}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
        >
          Nueva Venta
        </button>
      {/* Tabla de Ventas */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Lista de Ventas</h3>        {renderTablaVentas()}
        
        {/* Botón Ver más ventas */}
        {!loading && ventas.length > ventasVisibles && (
          <div className="flex justify-center mt-4">
            <button
              onClick={handleVerMasVentas}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Ver más ({ventas.length - ventasVisibles} restantes)
            </button>
          </div>
        )}
      </div>

      {/* Modal de Venta */}
      <VentaModal
        isVisible={isModalVisible}
        onClose={handleCloseModal}
        onSave={handleSaveVenta}
        colaboradores={colaboradores}
        productos={productos}
        isSaving={isSaving}
      />      {/* Modal de Devolución */}
      <DevolucionModal
        isVisible={showDevolucionModal}
        onClose={() => {
          setShowDevolucionModal(false);
          setVentaSeleccionada(null);
        }}
        venta={ventaSeleccionada}
        onProcesarDevolucion={handleProcesarDevolucion}
        isProcesando={processingDevolucion}
      />

      {/* Tabla de Devoluciones */}
      <DevolucionesList
        devoluciones={devoluciones}
      />
    </div>
  );
}

export default VentaList;