import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api'; // Ajusta la ruta si es necesario
import { useAuth } from '@clerk/clerk-react';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Envuelve loadVentas en useCallback
  const loadVentas = useCallback(async (token) => {
    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const ventasRes = await api.get(
        `/ventas?page=${currentPage}&limit=15`,
        config
      );

      console.log('Datos recibidos del servidor:', ventasRes.data);

      // Verificar si la propiedad 'ventas' existe en la respuesta
      if (ventasRes.data && Array.isArray(ventasRes.data.ventas)) {
        setVentas(ventasRes.data.ventas); // Establecer las ventas en el estado
        setTotalPages(ventasRes.data.totalPages || 1); // Establecer el total de páginas
      } else {
        console.warn('La respuesta no contiene una propiedad "ventas" válida:', ventasRes.data);
        setVentas([]); // Si no es un array, asignar un array vacío
      }
    } catch (err) {
      console.error('Error al cargar ventas:', err);
      setError('Error al cargar los datos de ventas');
    }
  }, [currentPage]); // currentPage como dependencia

  // Obtener ventas, colaboradores y productos en un solo useEffect
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = await getToken();
        if (!token) {
          throw new Error('No estás autorizado');
        }

        // Configurar headers para todas las solicitudes
        const config = {
          headers: { 'Authorization': `Bearer ${token}` },
        };

        // Cargar ventas
        await loadVentas(token);

        // Cargar colaboradores y productos
        const [colaboradoresRes, productosRes] = await Promise.all([
          api.get('/ventas/colaboradores', config),
          api.get('/ventas/productos', config),
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
  }, [getToken, currentPage, loadVentas]);

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
      <button
        onClick={toggleFormVisibility}
        className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 mb-4"
      >
        {ventaData.showForm ? 'Cancelar' : 'Agregar Venta'}
      </button>

      {/* Tabla de ventas */}
      <table className="min-w-full table-auto border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">#</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Colaborador</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Producto</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Cantidad</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Monto Total</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Estado de Pago</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {ventas.length ? (
            ventas.map((venta, index) => (
              <tr key={venta._id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm text-gray-600 border-b">{index + 1}</td>
                <td className="px-4 py-2 text-sm text-gray-600 border-b">{venta.colaboradorId?.nombre || 'N/A'}</td>
                <td className="px-4 py-2 text-sm text-gray-600 border-b">{venta.productoId?.nombre || 'N/A'}</td>
                <td className="px-4 py-2 text-sm text-gray-600 border-b">{venta.cantidad}</td>
                <td className="px-4 py-2 text-sm text-gray-600 border-b">S/ {venta.montoTotal}</td>
                <td className="px-4 py-2 text-sm text-gray-600 border-b">{venta.estadoPago}</td>
                <td className="px-4 py-2 text-sm text-gray-600 border-b">
                  <button
                    onClick={() => handleEditVenta(venta)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="px-4 py-2 text-center text-gray-600">No hay ventas registradas.</td>
            </tr>
          )}
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
                  productos.map((producto) => (
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

            {/* Estado de Pago Select */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado de Pago</label>
              <select
                value={ventaData.estadoPago}
                onChange={handleEstadoPagoChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Pagado">Pagado</option>
                <option value="Parcial">Parcial</option>
              </select>
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
    </div>
  );
}

export default VentaList;