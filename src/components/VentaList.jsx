import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api'; // Ajusta la ruta si es necesario
import { useAuth } from '@clerk/clerk-react';
import SalesOverTimeChart from './graphics/SalesOverTimeChart';

function VentaList() {
  const { getToken } = useAuth();
  const [ventaData, setVentaData] = useState({
    colaboradorId: '',
    productoId: '',
    cantidad: 0,
    montoTotal: 0,
    estadoPago: 'Pendiente',
    cantidadPagada: 0,
    editing: false,
    currentVentaId: null,
    showForm: false,
  });
  const [ventas, setVentas] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [productoPrecio, setProductoPrecio] = useState(0);
  const [cantidadDisponible, setCantidadDisponible] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRange, setSelectedRange] = useState('year');
  const [devoluciones, setDevoluciones] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [cantidadDevuelta, setCantidadDevuelta] = useState(0);
  const [motivo, setMotivo] = useState("");
  const [devolucionesCurrentPage] = useState(1);
  const [ventasLimit, setVentasLimit] = useState(20);
  const [devolucionesLimit, setDevolucionesLimit] = React.useState(20); // mostrar 10 inicialmente

const loadVentas = useCallback(async () => {
  try {
    const token = await getToken();
    const response = await api.get('/ventas', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.data && response.data.ventas) {
      setVentas(response.data.ventas);
    } else {
      console.error('Estructura de respuesta inválida:', response.data);
      setVentas([]);
    }
  } catch (error) {
    console.error('Error al cargar ventas:', error);
    setError('Error al cargar las ventas');
    setVentas([]);
  }
}, [getToken, setError]);

const loadDevoluciones = useCallback(async () => {
  try {
    const token = await getToken();
    const response = await api.get('/ventas/devoluciones', {
      params: { page: devolucionesCurrentPage, limit: 10 },
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.data) {
      setDevoluciones(response.data.devoluciones || []);
    } else {
      throw new Error('No se recibieron datos de devoluciones');
    }
  } catch (error) {
    console.error('Error al cargar devoluciones:', error);
    setError('Error al cargar las devoluciones: ' + error.message);
    setDevoluciones([]);
  }
}, [getToken, devolucionesCurrentPage, setError]);

// 2. Actualiza el useEffect incluyendo todas las dependencias necesarias
useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No estás autorizado');
      }

      const config = {
        headers: { 'Authorization': `Bearer ${token}` }
      };

      // Cargar ventas y devoluciones
      await Promise.all([
        loadVentas(),
        loadDevoluciones()
      ]);

      // Cargar colaboradores y productos
      const [colaboradoresRes, productosRes] = await Promise.all([
        api.get('/ventas/colaboradores', config),
        api.get('/ventas/productos', config)
      ]);

      setColaboradores(colaboradoresRes.data);
      setProductos(productosRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error al obtener los datos:', error);
      setError(error.message || 'Error al cargar los datos');
      setLoading(false);
    }
  };

  fetchData();
}, [getToken, loadVentas, loadDevoluciones]);

  // Función para manejar el cambio de cantidad y recalcular monto total
  const handleCantidadChange = (e) => {
    const cantidad = parseInt(e.target.value, 10) || 0;
    const montoTotal = cantidad * productoPrecio;
    setVentaData((prevState) => ({
      ...prevState,
      cantidad,
      montoTotal,
    }));
  };

  // Función para manejar la selección de producto
  const handleProductoChange = (e) => {
    const productoId = e.target.value;
    const producto = productos.find((prod) => prod._id === productoId);
    setProductoPrecio(producto ? producto.precio : 0);
    setCantidadDisponible(producto ? producto.cantidadRestante : 0);

    setVentaData((prevState) => ({
      ...prevState,
      productoId,
      montoTotal: prevState.cantidad * (producto ? producto.precio : 0),
    }));
  };

  // Función para manejar la selección del estado de pago
  const handleEstadoPagoChange = (e) => {
    const estadoPago = e.target.value;
    setVentaData((prevState) => ({
      ...prevState,
      estadoPago,
      cantidadPagada:
        estadoPago === 'Parcial' ? prevState.cantidadPagada :
        estadoPago === 'Pagado' ? prevState.montoTotal : 0,
    }));
  };

  // Validación de la venta
  const validateVenta = () => {
    if (!ventaData.colaboradorId) {
      alert('Debes seleccionar un colaborador.');
      return false;
    }
    
    if (!ventaData.productoId) {
      alert('Debes seleccionar un producto.');
      return false;
    }
    
    if (ventaData.cantidad <= 0) {
      alert('La cantidad debe ser mayor a cero.');
      return false;
    }
    
    if (ventaData.cantidad > cantidadDisponible) {
      alert(`No puedes vender más de ${cantidadDisponible} unidades de este producto.`);
      return false;
    }
    
    if (ventaData.estadoPago === 'Parcial' && ventaData.cantidadPagada <= 0) {
      alert('La cantidad pagada debe ser mayor a cero cuando el estado es Parcial.');
      return false;
    }
    
    if (ventaData.estadoPago === 'Pendiente' && ventaData.cantidadPagada !== 0) {
      alert('La cantidad pagada debe ser cero cuando el estado es Pendiente.');
      return false;
    }
    
    if (ventaData.estadoPago === 'Pagado' && ventaData.cantidadPagada !== ventaData.montoTotal) {
      alert('La cantidad pagada debe ser igual al monto total cuando el estado es Pagado.');
      return false;
    }
    
    return true;
  };

  // Función para agregar o editar la venta
  const handleAddOrEditVenta = async () => {
    if (!validateVenta()) return;

    try {
      const token = await getToken();
      if (!token) {
        alert('No estás autorizado');
        return;
      }

      // Ejecutar la operación de agregar o editar
      if (ventaData.editing) {
        await api.put(
          `/ventas/${ventaData.currentVentaId}`, 
          ventaData, 
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        alert('Venta actualizada exitosamente');
      } else {
        await api.post(
          '/ventas', 
          ventaData, 
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        alert('Venta creada exitosamente');
      }

      // Importante: Recargar los datos desde el servidor
      await loadVentas(token);
      resetForm();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar la venta: ' + (error.response ? error.response.data.message : error.message));
    }
  };

  // Función para eliminar una venta
  const handleDeleteVenta = async () => {
      // Verificar si la venta tiene devoluciones
  const devolucionesVenta = devoluciones.filter(d => d.ventaId._id === ventaData.currentVentaId);
  if (devolucionesVenta.length > 0) {
    alert('No se puede eliminar una venta que tiene devoluciones asociadas');
    return;
  }
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta venta?')) {
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        alert('No estás autorizado');
        return;
      }

      await api.delete(
        `/ventas/${ventaData.currentVentaId}`, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      // Importante: Recargar los datos desde el servidor
      await loadVentas(token);
      resetForm();
      alert('Venta eliminada exitosamente');
    } catch (error) {
      console.error('Error al eliminar la venta:', error);
      alert('Error al eliminar la venta: ' + (error.response ? error.response.data.message : error.message));
    }
  };

  // Función para reiniciar el formulario
  const resetForm = () => {
    setVentaData({
      colaboradorId: '',
      productoId: '',
      cantidad: 0,
      montoTotal: 0,
      estadoPago: 'Pendiente',
      cantidadPagada: 0,
      editing: false,
      currentVentaId: null,
      showForm: false,
    });
    setProductoPrecio(0);
    setCantidadDisponible(0);
  };

  // Función para manejar la edición de una venta
  const handleEditVenta = (venta) => {
      // Verificar si la venta tiene devoluciones
  const devolucionesVenta = devoluciones.filter(d => d.ventaId._id === venta._id);
  if (devolucionesVenta.length > 0) {
    alert('No se puede editar una venta que tiene devoluciones asociadas');
    return;
  }

    setVentaData({
      colaboradorId: venta.colaboradorId._id,
      productoId: venta.productoId._id,
      cantidad: venta.cantidad,
      montoTotal: venta.montoTotal,
      estadoPago: venta.estadoPago,
      cantidadPagada: venta.cantidadPagada,
      editing: true,
      currentVentaId: venta._id,
      showForm: true,
    });

    const producto = productos.find((prod) => prod._id === venta.productoId._id);
    setProductoPrecio(producto ? producto.precio : 0);
    setCantidadDisponible(producto ? producto.cantidadRestante : 0);
  };

  // Alternar visibilidad del formulario
  const toggleFormVisibility = () => {
    setVentaData((prevState) => ({
      ...prevState,
      showForm: !prevState.showForm,
    }));
    
    if (!ventaData.showForm && ventaData.editing) {
      resetForm();
    }
  };

    // Cambiar el rango de tiempo
  const handleRangeChange = (range) => {
    setSelectedRange(range);
  };

  useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No estás autorizado');
      }

      const config = {
        headers: { 'Authorization': `Bearer ${token}` }
      };

      await Promise.all([
        loadVentas(),
        loadDevoluciones()
      ]);

      const [colaboradoresRes, productosRes] = await Promise.all([
        api.get('/ventas/colaboradores', config),
        api.get('/ventas/productos', config)
      ]);

      setColaboradores(colaboradoresRes.data);
      setProductos(productosRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error al obtener los datos:', error);
      setError(error.message || 'Error al cargar los datos');
      setLoading(false);
    }
  };

  fetchData();
}, [getToken, loadVentas, loadDevoluciones, devolucionesCurrentPage]);
  
  // Función para abrir el modal de devolución y seleccionar el producto
  const abrirModalDevolucion = (producto) => {
    setSelectedProducto(producto); // Guardamos el producto seleccionado
    setCantidadDevuelta(0); // Reiniciar cantidad devuelta
    setMotivo(""); // Limpiar motivo
    setIsModalVisible(true); // Mostrar el modal
  };

  // Función para cerrar el modal de devolución
const handleRegistrarDevolucion = async () => {
  if (!selectedProducto || !cantidadDevuelta || !motivo) {
    alert("Por favor complete todos los campos");
    return;
  }

  if (parseInt(cantidadDevuelta) > selectedProducto.cantidad) {
    alert("La cantidad a devolver no puede ser mayor a la cantidad vendida");
    return;
  }

  try {
    const token = await getToken();
    const precioUnitario = selectedProducto.montoTotal / selectedProducto.cantidad;
    const montoDevolucion = precioUnitario * parseInt(cantidadDevuelta);

    const devolucionData = {
      ventaId: selectedProducto._id,
      productoId: selectedProducto.productoId._id,
      colaboradorId: selectedProducto.colaboradorId._id, // Importante: incluir el colaboradorId
      cantidadDevuelta: parseInt(cantidadDevuelta),
      montoDevolucion: parseFloat(montoDevolucion.toFixed(2)),
      motivo
    };

    await api.post('/ventas/devoluciones', devolucionData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Recargar tanto las ventas como las devoluciones
    await Promise.all([
      loadVentas(),
      loadDevoluciones()
    ]);

    alert("Devolución registrada exitosamente");
    
    // Limpiar el estado del modal
    setIsModalVisible(false);
    setSelectedProducto(null);
    setCantidadDevuelta(0);
    setMotivo("");

  } catch (error) {
    console.error('Error al registrar la devolución:', error);
    alert(error.response?.data?.message || 'Error al registrar la devolución');
  }
};


const handleEliminarDevolucion = async (devolucionId) => {
  if (!window.confirm('¿Está seguro de eliminar esta devolución?')) {
    return;
  }

  try {
    const token = await getToken();
    await api.delete(`/ventas/devoluciones/${devolucionId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Recargar los datos
    await Promise.all([
      loadVentas(),
      loadDevoluciones()
    ]);

    alert('Devolución eliminada correctamente');
  } catch (error) {
    console.error('Error al eliminar la devolución:', error);
    alert(error.response?.data?.message || 'Error al eliminar la devolución');
  }
};



  // Renderizado condicional para estados de carga y error
  if (loading) {
    return <div className="p-4 text-center">Cargando datos...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        Error: {error}
        <button 
          onClick={() => window.location.reload()} 
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="list">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Ventas</h2>
      
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

      {/* Gráfico de ventas con mensaje cuando no hay datos */}
      <div className="mb-8">
        {ventas.length > 0 ? (
          <SalesOverTimeChart ventas={ventas} devoluciones={devoluciones} selectedRange={selectedRange} />
        ) : (
          <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-lg text-gray-500">No hay datos de ventas disponibles</p>
          </div>
        )}
      </div>  
      
      <button
        onClick={toggleFormVisibility}
        className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 mb-4"
      >
        {ventaData.showForm ? 'Cancelar' : 'Agregar Venta'}
      </button>

<table className="min-w-full table-auto border-collapse border border-gray-300">
  <thead className="bg-gray-100">
    <tr>
      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">#</th>
      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Colaborador</th>
      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Producto</th>
      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Cantidad</th>
      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Monto Total</th>
      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Devoluciones</th>
      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Monto Devuelto</th>
      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Estado de Pago</th>
      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Acciones</th>
    </tr>
  </thead>
  <tbody>
    {ventas.length ? (
      ventas.slice(0, ventasLimit).map((venta, index) => {

        const rowNumber = index + 1;

        // Obtener devoluciones para esta venta
        const devolucionesVenta = devoluciones.filter(d => d.ventaId._id === venta._id);
        const cantidadTotalDevuelta = devolucionesVenta.reduce((acc, dev) => acc + (parseInt(dev.cantidadDevuelta) || 0), 0);
        const montoTotalDevuelto = devolucionesVenta.reduce((acc, dev) => acc + (parseFloat(dev.montoDevolucion) || 0), 0);
        const tieneDevolucion = devolucionesVenta.length > 0;

        return (
          <tr key={venta._id} className="hover:bg-gray-50">
            <td className="px-4 py-2 text-sm text-gray-600 border-b">{rowNumber}</td>
            <td className="px-4 py-2 text-sm text-gray-600 border-b">{venta.colaboradorId?.nombre || 'N/A'}</td>
            <td className="px-4 py-2 text-sm text-gray-600 border-b">{venta.productoId?.nombre || 'N/A'}</td>
            <td className="px-4 py-2 text-sm text-gray-600 border-b">{venta.cantidad}</td>
            <td className="px-4 py-2 text-sm text-gray-600 border-b">S/ {venta.montoTotal.toFixed(2)}</td>
            <td className="px-4 py-2 text-sm text-gray-600 border-b">
              {cantidadTotalDevuelta > 0 ? cantidadTotalDevuelta : '0'}
            </td>
            <td className="px-4 py-2 text-sm text-gray-600 border-b">S/ {montoTotalDevuelto.toFixed(2)}</td>
            <td className="px-4 py-2 text-sm text-gray-600 border-b">{venta.estadoPago}</td>
            <td className="px-4 py-2 text-sm text-gray-600 border-b flex space-x-2">
              {!tieneDevolucion && (
                <button
                  onClick={() => handleEditVenta(venta)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  Editar
                </button>
              )}
              {venta.cantidad - cantidadTotalDevuelta > 0 && (
                <button
                  onClick={() => abrirModalDevolucion(venta)}
                  className="text-red-500 hover:text-red-700"
                >
                  Devolver
                </button>
              )}
            </td>
          </tr>
        );
      })
    ) : (
      <tr>
        <td colSpan="9" className="px-4 py-2 text-center text-gray-600">
          No hay ventas registradas.
        </td>
      </tr>
    )}
  </tbody>
</table>

{/* Botón Ver más: fuera de la tabla y solo si hay más ventas que mostrar */}
{ventasLimit < ventas.length && (
  <div className="flex justify-center mt-4">
    <button
      onClick={() => setVentasLimit(ventasLimit + 20)} // Aumenta 20 ventas al mostrar
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      Ver más
    </button>
  </div>
)}


      {/* Historial de Devoluciones */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Historial de Devoluciones</h3>
        <table className="min-w-full table-auto border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Colaborador</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Fecha</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Producto</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Cantidad</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Monto</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Motivo</th>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {devoluciones.length ? (
              devoluciones.slice(0, devolucionesLimit).map((devolucion) => (
                <tr key={devolucion._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-600 border-b">
                    {devolucion.ventaId?.colaboradorId?.nombre || 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 border-b">
                    {new Date(devolucion.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 border-b">
                    {devolucion.productoId?.nombre || 'N/A'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 border-b">{devolucion.cantidadDevuelta}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 border-b">S/ {devolucion.montoDevolucion?.toFixed(2)}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 border-b">{devolucion.motivo}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 border-b">
                    <button
                      onClick={() => handleEliminarDevolucion(devolucion._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-4 py-2 text-center text-gray-600">
                  No hay devoluciones registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Botón Ver más Devoluciones */}
        {devolucionesLimit < devoluciones.length && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setDevolucionesLimit(devolucionesLimit + 20)} // Incrementa 10 devoluciones cada vez
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Ver más
            </button>
          </div>
        )}
      </div>
        

        
      {/* Formulario Modal para Agregar o Editar Venta */}
      {ventaData.showForm && (
        <div className="modal-overlay fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="modal-content bg-white rounded-lg shadow-lg w-96 p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">{ventaData.editing ? 'Editar Venta' : 'Agregar Venta'}</h3>
            
            {/* Colaborador Select */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Colaborador</label>
              <select
                value={ventaData.colaboradorId}
                onChange={(e) => setVentaData({ ...ventaData, colaboradorId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Selecciona un Colaborador</option>
                {colaboradores && colaboradores.length > 0 ? (
                  colaboradores.map((colaborador) => (
                    <option key={colaborador._id} value={colaborador._id}>
                      {colaborador.nombre}
                    </option>
                  ))
                ) : (
                  <option disabled>No hay colaboradores disponibles</option>
                )}
              </select>
              {colaboradores.length === 0 && (
                <p className="text-red-500 text-xs mt-1">
                  No se encontraron colaboradores. Verifica la conexión con el servidor.
                </p>
              )}
            </div>

{/* Producto Select */}
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
  <select
    value={ventaData.productoId}
    onChange={handleProductoChange}
    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
  >
    <option value="">Selecciona un Producto</option>
    {productos && productos.length > 0 ? (
      productos
        .filter((producto) => producto.cantidad - producto.cantidadVendida > 0) 
        .map((producto) => (
          <option key={producto._id} value={producto._id}>
            {producto.nombre} (Stock: {producto.cantidad - producto.cantidadVendida})
          </option>
        ))
    ) : (
      <option disabled>No hay productos disponibles</option>
    )}
  </select>
</div>

            {/* Cantidad Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
              <input
                type="number"
                value={ventaData.cantidad}
                onChange={handleCantidadChange}
                min="1"
                max={cantidadDisponible}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {cantidadDisponible > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Disponible: {cantidadDisponible} unidades
                </p>
              )}
            </div>

            {/* Monto Total (Read Only) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto Total</label>
              <input
                type="number"
                value={ventaData.montoTotal}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
              />
            </div>



            {/* Cantidad Pagada (solo para pagos parciales) */}
            {ventaData.estadoPago === 'Parcial' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Pagada</label>
                <input
                  type="number"
                  value={ventaData.cantidadPagada || ''}
                  onChange={(e) => setVentaData({ ...ventaData, cantidadPagada: parseFloat(e.target.value) || 0 })}
                  min="0.01"
                  max={ventaData.montoTotal - 0.01}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            )}

            {/* Botones de acción */}
            <div className="modal-buttons flex justify-end space-x-2 mt-6">
              {ventaData.editing && (
                <button
                  onClick={handleDeleteVenta}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Eliminar
                </button>
              )}
              <button
                onClick={handleAddOrEditVenta}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                disabled={!ventaData.colaboradorId || !ventaData.productoId || ventaData.cantidad <= 0}
              >
                {ventaData.editing ? 'Actualizar' : 'Agregar'}
              </button>
              <button
                onClick={toggleFormVisibility}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Cancelar
              </button>

          </div>
        </div>
      </div>
    )}
    

      
    {/* Modal de Devolución */}
    {isModalVisible && selectedProducto && (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="modal-overlay absolute inset-0 bg-black opacity-50"></div>
        <div className="modal-content bg-white p-6 rounded-lg shadow-xl z-50 w-96">
          <h3 className="text-xl font-semibold mb-4">Registrar Devolución</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Producto: {selectedProducto.productoId?.nombre || selectedProducto.nombre}
            </label>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad a devolver:
            </label>
            <input
              type="number"
              value={cantidadDevuelta}
              onChange={(e) => setCantidadDevuelta(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              min="1"
              max={selectedProducto.cantidad}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo:
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows="3"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsModalVisible(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              onClick={handleRegistrarDevolucion}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Registrar
            </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VentaList;