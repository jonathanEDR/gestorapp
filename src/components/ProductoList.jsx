import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ProductStatsChart from './graphics/ProductStatsChart';

function ProductoList() {
  const { getToken } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [productoData, setProductoData] = useState({
    nombre: '',
    precioCompra: 0,
    precio: 0,
    cantidad: 0,
    editing: false,
    currentProductoId: null,
    showForm: false
  });
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [productosTerminados, setProductosTerminados] = useState([]);
  const [paginaTerminados, setPaginaTerminados] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manejar parámetros de URL para filtros
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const searchTerm = searchParams.get('search') || '';

  // Función para actualizar URL con parámetros
  const updateUrlParams = (params) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  };

  // Filtrar productos por búsqueda
  const filteredProductos = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const productosPorPagina = 24;
  const startIndex = (currentPage - 1) * productosPorPagina;
  const productosAmostrar = filteredProductos.slice(startIndex, startIndex + productosPorPagina);

  const productosPorPaginaTerminados = 10;
  const productosTerminadosPorPagina = productosTerminados.slice(
    (paginaTerminados - 1) * productosPorPaginaTerminados,
    paginaTerminados * productosPorPaginaTerminados
  );

  // Envuelve fetchProductos en useCallback
  const fetchProductos = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) {
        setError('No estás autorizado');
        return;
      }

      const response = await api.get('/productos', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const productosActivos = [];
      const productosFinalizados = [];

      response.data.forEach((producto) => {
        if (producto.cantidadRestante === 0) {
          productosFinalizados.push({
            ...producto,
            fechaAgotamiento: new Date().toLocaleString(),
          });
        } else {
          productosActivos.push(producto);
        }
      });

      setProductos(productosActivos);
      setProductosTerminados(productosFinalizados);
    } catch (error) {
      console.error('Error al obtener productos:', error);
      setError('Error al cargar productos');
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  // useEffect para llamar a fetchProductos
  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  const handleDeleteProducto = async () => {
    try {
      if (!productoData.currentProductoId) {
        setError('No se encontró el ID del producto');
        return;
      }

      const token = await getToken();
      if (!token) {
        setError('No estás autorizado');
        return;
      }

      await api.delete(`/productos/${productoData.currentProductoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setProductos(productos.filter(producto => producto._id !== productoData.currentProductoId));
      alert('Producto eliminado exitosamente');
      resetForm();
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      setError('Error al eliminar producto: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAddOrEditProducto = async () => {
    if (!productoData.nombre || productoData.precio <= 0 || productoData.precioCompra <= 0 || productoData.cantidad < 0) {
      setError('Por favor, completa todos los campos correctamente.');
      return;
    }
  
    try {
      setIsSubmitting(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError('No estás autorizado');
        return;
      }
  
      if (productoData.editing) {
        // Actualizar producto existente
        const response = await api.put(`/productos/${productoData.currentProductoId}`, {
          nombre: productoData.nombre,
          precioCompra: productoData.precioCompra,
          precio: productoData.precio,
          cantidad: productoData.cantidad
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
  
        // Actualiza el producto en el estado de productos
        setProductos(productos.map(producto => producto._id === productoData.currentProductoId ? response.data : producto));
        alert('Producto actualizado exitosamente');
        resetForm();
      } else {
        // Agregar nuevo producto
        const response = await api.post('/productos', {
          nombre: productoData.nombre,
          precioCompra: productoData.precioCompra,
          precio: productoData.precio,
          cantidad: productoData.cantidad
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
  
        // Actualiza la lista de productos con el nuevo producto
        setProductos(prevState => [...prevState, response.data]);
        alert('Producto agregado exitosamente');
        resetForm();
      }
    } catch (error) {
      console.error('Error al gestionar producto:', error);
      setError('Error: ' + (error.response?.data?.message || error.message));
     } finally {
      setIsSubmitting(false);
    }
  };
  

  const handleEditProducto = (producto) => {
    setProductoData({
      ...productoData,
      editing: true,
      currentProductoId: producto._id,
      nombre: producto.nombre,
      precio: producto.precio,
      precioCompra: producto.precioCompra,
      cantidad: producto.cantidad,
      showForm: true
    });
  };

  const resetForm = () => {
    setProductoData({
      nombre: '',
      precioCompra: 0,
      precio: 0,
      cantidad: 0,
      editing: false,
      currentProductoId: null,
      showForm: false
    });
  };

  const toggleFormVisibility = () => {
    setProductoData(prevState => ({
      ...prevState,
      showForm: !prevState.showForm
    }));
  };


  return (
    <div className="list p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Inventario de Productos</h2>
        
        {/* Barra de búsqueda */}
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => updateUrlParams({ search: e.target.value, page: 1 })}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Mostrar errores */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Mostrar indicador de carga */}
      {isLoading && <p>Cargando productos...</p>}
      

           {/* Agregar el gráfico aquí */}
        <div className="mb-8">
          {productos.length > 0 ? (
        <ProductStatsChart 
          productos={productos}
          productosTerminados={productosTerminados}
        />
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-lg text-gray-500">No hay datos de productos disponibles</p>
            </div>
          )}
        </div>


      {/* Botón para mostrar o cancelar el formulario */}
      <button
        onClick={toggleFormVisibility}
        className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 mb-4"
      >
        {productoData.showForm ? 'Cancelar' : 'Agregar Producto'}
      </button>

      {/* Modal (formulario) que se muestra cuando showForm es true */}
      {productoData.showForm && (
        <div className="modal-overlay fixed inset-0 flex items-center justify-center z-50">
          <div className="modal-content bg-white rounded-lg shadow-lg w-96 p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">{productoData.editing ? 'Editar Producto' : 'Agregar Producto'}</h3>

            {/* Nombre del producto */}
            <input
              type="text"
              placeholder="Nombre"
              value={productoData.nombre}
              onChange={(e) => setProductoData({ ...productoData, nombre: e.target.value })}
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            {/* Precio de compra */}
            <input
              type="number"
              placeholder="Precio de Compra"
              value={productoData.precioCompra || ''}
              onChange={(e) => setProductoData({ ...productoData, precioCompra: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />


            {/* Precio del producto */}
            <input
              type="number"
              placeholder="Precio"
              value={productoData.precio || ''}
              onChange={(e) => setProductoData({ ...productoData, precio: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            {/* Cantidad del producto */}
            <input
              type="number"
              placeholder="Cantidad"
              value={productoData.cantidad || ''}
              onChange={(e) => setProductoData({ ...productoData, cantidad: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            {/* Botones del modal */}
            <div className="modal-buttons flex justify-end space-x-2 mt-4">
        <button
          onClick={handleAddOrEditProducto}
          disabled={isSubmitting}
          className={`px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600
            ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? 'Guardando...' : (productoData.editing ? 'Actualizar' : 'Agregar')}
        </button>
              {productoData.editing && (
                <button
                  onClick={handleDeleteProducto}
                  className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center justify-center"
                >
                  {/* Ícono de eliminar */}
                  <i className="fa fa-trash mr-2"></i> {/* FontAwesome trash icon */}
                  Eliminar Producto
                </button>
              )}

              <button
                onClick={resetForm}
                className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tarjetas de Productos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 mt-6">
        {productosAmostrar.map((producto) => (
          <div 
            key={producto._id} 
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-100"
          >
            {/* Header de la tarjeta */}
            <div className="p-4 border-b border-gray-50">
              <h3 className="font-medium text-gray-800 truncate">{producto.nombre}</h3>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                S/ {producto.precio.toFixed(2)}
              </p>
            </div>

            {/* Contenido de la tarjeta */}
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Stock Inicial:</span>
                <span className="font-medium text-gray-800">{producto.cantidad}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Vendidos:</span>
                <span className="font-medium text-gray-800">{producto.cantidadVendida}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Disponible:</span>
                <span className={`font-medium ${
                  (producto.cantidad - producto.cantidadVendida) <= 5 
                    ? 'text-red-600' 
                    : 'text-green-600'
                }`}>
                  {producto.cantidad - producto.cantidadVendida}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${
                    (producto.cantidad - producto.cantidadVendida) <= 5 
                      ? 'bg-red-500' 
                      : 'bg-green-500'
                  }`}
                  style={{
                    width: `${(producto.cantidadVendida / producto.cantidad) * 100}%`
                  }}
                />
              </div>
            </div>

            {/* Footer de la tarjeta */}
            <div className="p-4 bg-gray-50">
              <button
                onClick={() => handleEditProducto(producto)}
                className="w-full bg-white text-blue-600 px-4 py-2 rounded-lg 
                          border border-blue-600 hover:bg-blue-50 
                          transition-colors duration-300 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Paginación mejorada */}
      {filteredProductos.length > productosPorPagina && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
            onClick={() => updateUrlParams({ page: Math.max(1, currentPage - 1) })}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
          >
            Anterior
          </button>
          
          <span className="px-4 py-2">
            Página {currentPage} de {Math.ceil(filteredProductos.length / productosPorPagina)}
          </span>
          
          <button
            onClick={() => updateUrlParams({ page: currentPage + 1 })}
            disabled={currentPage >= Math.ceil(filteredProductos.length / productosPorPagina)}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Mostrar productos terminados */}
      <h3 className="text-2xl font-semibold text-gray-800 mt-6">Productos Terminados</h3>
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr>
              <th className="px-6 py-2 border-b text-left">Nombre</th>
              <th className="px-6 py-2 border-b text-left">Cantidad</th>
              <th className="px-6 py-2 border-b text-left">Cantidad Vendida</th>
              <th className="px-6 py-2 border-b text-left">Costo</th>
              <th className="px-6 py-2 border-b text-left">Precio</th>
              <th className="px-6 py-2 border-b text-left">Fecha de Agotamiento</th>
            </tr>
          </thead>
          <tbody>
            {productosTerminadosPorPagina.map((producto) => (
              <tr key={producto._id} className="hover:bg-gray-100">
                <td className="px-6 py-3 border-b">{producto.nombre}</td>
                <td className="px-6 py-3 border-b">{producto.cantidad}</td>
                <td className="px-6 py-3 border-b">{producto.cantidadVendida}</td>
                <td className="px-6 py-3 border-b">S/ {producto.precioCompra}</td>
                <td className="px-6 py-3 border-b">S/ {producto.precio}</td>
                <td className="px-6 py-3 border-b">{producto.fechaAgotamiento}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación de productos terminados */}
      <div className="flex justify-between mt-4">
        <button
          onClick={() => setPaginaTerminados(paginaTerminados > 1 ? paginaTerminados - 1 : 1)}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
        >
          Anterior
        </button>
        <span>Página {paginaTerminados}</span>
        <button
          onClick={() => setPaginaTerminados(paginaTerminados + 1)}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
        >
          Siguiente
        </button>
      </div>

    </div>
  );
}

export default ProductoList;
