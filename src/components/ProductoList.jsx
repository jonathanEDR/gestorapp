import React, { useEffect, useState,useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api from '../services/api';
import ProductStatsChart from './graphics/ProductStatsChart';

function ProductoList() {
  const { getToken } = useAuth();
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
  const productosPorPagina = 24;
  const productosAmostrar = productos.slice(0, productosPorPagina);

  const [paginaTerminados, setPaginaTerminados] = useState(1);
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
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Inventario de Productos</h2>

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
<div className="grid grid-cols-6 gap-4 mt-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">

        {productosAmostrar.map((producto) => (
          <div key={producto._id} className="card p-4 border rounded-md shadow-lg">
            <h3 className="font-semibold text-xl">{producto.nombre}</h3>
            <p className="text-lg">S/ {producto.precio}</p>
            <p>Cantidad: {producto.cantidad}</p>
            <p>Cantidad Vendida: {producto.cantidadVendida}</p>
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
        <th className="px-6 py-2 border-b text-left">Costo</th>
        <th className="px-6 py-2 border-b text-left">Precio</th>
        <th className="px-6 py-2 border-b text-left">Fecha de Agotamiento</th>
      </tr>
    </thead>
    <tbody>
      {productosTerminadosPorPagina.map((producto) => (
        <tr key={producto._id} className="hover:bg-gray-100">
          <td className="px-6 py-3 border-b">{producto.nombre}</td>
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
