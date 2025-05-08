import React, { useEffect, useState,useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api from '../services/api';

function ProductoList() {
  const { getToken } = useAuth();
  const [productoData, setProductoData] = useState({
    nombre: '',
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

  // Envuelve fetchProductos en useCallback
  const fetchProductos = useCallback(async () => {
    try {
      const token = await getToken();
      console.log('Token recibido:', token); // Verifica el token
      if (!token) {
        setError('No estás autorizado');
        setIsLoading(false);
        return;
      }

      const response = await api.get('/productos', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Procesar productos para mover los que tienen cantidadRestante == 0 a "productosTerminados"
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
    if (!productoData.nombre || productoData.precio <= 0 || productoData.cantidad < 0) {
      setError('Por favor, completa todos los campos correctamente.');
      return;
    }
  
    try {
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
    }
  };
  

  const handleEditProducto = (producto) => {
    setProductoData({
      ...productoData,
      editing: true,
      currentProductoId: producto._id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: producto.cantidad,
      showForm: true
    });
  };

  const resetForm = () => {
    setProductoData({
      nombre: '',
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
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Inventario de Productos</h2>

            {/* Mostrar errores */}
            {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Mostrar indicador de carga */}
      {isLoading && <p>Cargando productos...</p>}
      
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
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                {productoData.editing ? 'Actualizar Producto' : 'Agregar Producto'}
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
      <div className="grid grid-cols-4 gap-4 mt-4">
        {productos.map((producto) => (
          <div key={producto._id} className="card p-4 border rounded-md shadow-lg">
            <h3 className="font-semibold text-xl">{producto.nombre}</h3>
            <p className="text-lg">S/ {producto.precio}</p>
            <p>Cantidad: {producto.cantidad}</p>
            <div className="mt-4">
              <button
                onClick={() => handleEditProducto(producto)}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>
{/* Mostrar productos terminados */}
<h3 className="text-2xl font-semibold text-gray-800 mt-6">Productos Terminados</h3>
<div className="overflow-x-auto mt-4">
  <table className="min-w-full table-auto border-collapse">
    <thead>
      <tr>
        <th className="px-6 py-2 border-b text-left">Nombre</th>
        <th className="px-6 py-2 border-b text-left">Precio</th>
        <th className="px-6 py-2 border-b text-left">Fecha de Agotamiento</th>
      </tr>
    </thead>
    <tbody>
      {productosTerminados.map((producto) => (
        <tr key={producto._id} className="hover:bg-gray-100">
          <td className="px-6 py-3 border-b">{producto.nombre}</td>
          <td className="px-6 py-3 border-b">{producto.cantidad}</td>

          <td className="px-6 py-3 border-b">S/ {producto.precio}</td>
          <td className="px-6 py-3 border-b">{producto.fechaAgotamiento}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
    </div>
  );
}

export default ProductoList;
