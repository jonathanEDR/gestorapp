import React, { useState } from 'react';
import { toast } from 'react-toastify';

// Función para obtener fecha actual en formato datetime-local
const getFechaActualLocal = () => {
  const ahora = new Date();
  // Ajustar a zona horaria local
  const fechaLocal = new Date(ahora.getTime() - (ahora.getTimezoneOffset() * 60000));
  return fechaLocal.toISOString().slice(0, 16);
};

const CarritoProductos = ({ productos, onRemove, onUpdateCantidad }) => {
  return (
    <div className="mb-3">
      <h4 className="text-sm font-medium mb-2">Productos en carrito</h4>
      <div className="max-h-48 overflow-y-auto">
        {productos.map((item, index) => (
          <div key={index} className="flex items-center justify-between py-1 border-b">
            <div className="flex-1">
              <p className="text-sm font-medium">{item.nombre}</p>
              <p className="text-xs text-gray-600">
                S/ {item.precioUnitario} × {item.cantidad} = S/ {item.subtotal}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={item.cantidad}
                onChange={(e) => onUpdateCantidad(index, e.target.value)}
                className="w-16 px-1 py-0.5 text-sm border rounded"
              />
              <button
                onClick={() => onRemove(index)}
                className="text-red-500 hover:text-red-700 px-1"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const VentaModal = ({
  isVisible,
  onClose,
  onSave,
  colaboradores,
  productos,
  isSaving
}) => {  const [ventaData, setVentaData] = useState({
    colaboradorId: '',
    fechaVenta: getFechaActualLocal(), // Usar función mejorada
    estadoPago: 'Pendiente'
  });

  const [carrito, setCarrito] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [resumen, setResumen] = useState({
    subtotal: 0,
    total: 0
  });

  const actualizarResumen = (items) => {
    const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
    setResumen({
      subtotal,
      total: subtotal
    });
  };

  const agregarAlCarrito = (producto, cantidad) => {
    console.log('Producto a agregar:', producto); // Debug
    
    if (!producto || !producto._id) {
      toast.error('Por favor seleccione un producto válido');
      return;
    }

    const cantidadNum = parseInt(cantidad);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      toast.error('Por favor ingrese una cantidad válida');
      return;
    }

    // Validar que el producto exista en la lista de productos
    const productoEnLista = productos.find(p => p._id === producto._id);
    if (!productoEnLista) {
      toast.error('El producto seleccionado no está disponible');
      return;
    }

    console.log('Producto encontrado en lista:', productoEnLista); // Debug

    // Buscar si el producto ya existe en el carrito usando el ID
    const productoExistente = carrito.find(item => item.productoId === productoEnLista._id);
    
    if (productoExistente) {
      const nuevaCantidad = productoExistente.cantidad + cantidadNum;
      if (nuevaCantidad > productoEnLista.cantidadRestante) {
        toast.error(`Stock insuficiente. Cantidad disponible: ${productoEnLista.cantidadRestante}`);
        return;
      }
      
      const nuevosItems = carrito.map(item =>
        item.productoId === productoEnLista._id
          ? {
              ...item,
              cantidad: nuevaCantidad,
              subtotal: parseFloat((productoEnLista.precio * nuevaCantidad).toFixed(2))
            }
          : item
      );
      console.log('Actualizando items en carrito:', nuevosItems); // Debug
      setCarrito(nuevosItems);
      actualizarResumen(nuevosItems);
    } else {
      if (cantidadNum > productoEnLista.cantidadRestante) {
        toast.error(`Stock insuficiente. Cantidad disponible: ${productoEnLista.cantidadRestante}`);
        return;
      }
      
      // Crear nuevo item asegurándose de que productoId sea el ID de MongoDB
      const nuevoItem = {
        productoId: productoEnLista._id, // Asegurarse de usar el ID correcto
        nombre: productoEnLista.nombre,
        cantidad: cantidadNum,
        precioUnitario: parseFloat(productoEnLista.precio),
        subtotal: parseFloat((productoEnLista.precio * cantidadNum).toFixed(2))
      };
      
      console.log('Nuevo item a agregar:', nuevoItem); // Debug
      const nuevosItems = [...carrito, nuevoItem];
      setCarrito(nuevosItems);
      actualizarResumen(nuevosItems);
    }
    
    setProductoSeleccionado(null);
    setCantidad(1);
  };

  const removerDelCarrito = (index) => {
    const nuevosItems = carrito.filter((_, i) => i !== index);
    setCarrito(nuevosItems);
    actualizarResumen(nuevosItems);
  };

  const actualizarCantidadEnCarrito = (index, nuevaCantidad) => {
    const cantidadNum = parseInt(nuevaCantidad);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      toast.error('Por favor ingrese una cantidad válida');
      return;
    }

    const item = carrito[index];
    if (!item) {
      toast.error('Producto no encontrado en el carrito');
      return;
    }

    const producto = productos.find(p => p._id === item.productoId);
    if (!producto) {
      toast.error('Producto no encontrado en el inventario');
      return;
    }

    if (cantidadNum > producto.cantidadRestante) {
      toast.error(`Stock insuficiente. Cantidad disponible: ${producto.cantidadRestante}`);
      return;
    }

    const nuevosItems = carrito.map((item, i) =>
      i === index
        ? {
            ...item,
            cantidad: cantidadNum,
            subtotal: parseFloat((item.precioUnitario * cantidadNum).toFixed(2))
          }
        : item
    );
    
    setCarrito(nuevosItems);
    actualizarResumen(nuevosItems);
  };  const limpiarFormulario = () => {
    setVentaData({
      colaboradorId: '',
      fechaVenta: getFechaActualLocal(), // Usar función mejorada
      estadoPago: 'Pendiente'
    });
    setCarrito([]);
    setProductoSeleccionado(null);
    setCantidad(1);
    setResumen({
      subtotal: 0,
      total: 0
    });
  };

  const handleGuardar = async () => {
    try {
      if (!ventaData.colaboradorId) {
        toast.error('Por favor seleccione un colaborador');
        return;
      }

      if (carrito.length === 0) {
        toast.error('Por favor agregue al menos un producto');
        return;
      }

      // Validación detallada del carrito
      const detallesValidados = [];
      for (const item of carrito) {
        console.log('Validando item del carrito:', item); // Debug
        
        if (!item.productoId) {
          console.error('Item inválido:', item);
          toast.error('Error: Producto inválido en el carrito');
          return;
        }

        const productoEnLista = productos.find(p => p._id === item.productoId);
        if (!productoEnLista) {
          console.error('Producto no encontrado:', item.productoId);
          toast.error(`Error: Producto no encontrado en el inventario`);
          return;
        }

        if (item.cantidad > productoEnLista.cantidadRestante) {
          toast.error(`Stock insuficiente para ${item.nombre}`);
          return;
        }

        detallesValidados.push({
          productoId: item.productoId,
          cantidad: parseInt(item.cantidad),
          precioUnitario: parseFloat(item.precioUnitario),
          subtotal: parseFloat(item.subtotal)
        });
      }      // Preparar fecha - convertir a formato ISO si se proporciona
      let fechaVentaFinal = null;
      if (ventaData.fechaVenta) {
        // Crear una fecha en la zona horaria local
        const fechaLocal = new Date(ventaData.fechaVenta);
        fechaVentaFinal = fechaLocal.toISOString();
        console.log('Fecha original:', ventaData.fechaVenta);
        console.log('Fecha convertida a ISO:', fechaVentaFinal);
      }

      const ventaPayload = {
        colaboradorId: ventaData.colaboradorId,
        detalles: detallesValidados,
        total: parseFloat(resumen.total.toFixed(2)),
        estadoPago: ventaData.estadoPago || 'Pendiente',
        cantidadPagada: ventaData.estadoPago === 'Pagado' ? parseFloat(resumen.total.toFixed(2)) : 0,
        fechaVenta: fechaVentaFinal
      };

      console.log('Payload de venta a enviar:', JSON.stringify(ventaPayload, null, 2)); // Debug detallado
      
      await onSave(ventaPayload);
      toast.success('Venta guardada exitosamente');
      limpiarFormulario();
      onClose();
    } catch (error) {
      console.error('Error detallado al guardar la venta:', error);
      console.error('Stack trace:', error.stack);
      toast.error(error.message || 'Error al guardar la venta');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white/30 flex items-center justify-center z-50 p-1">
      <div className="bg-white rounded-md shadow-lg max-w-md w-full max-h-[90vh] flex flex-col border border-gray-200">
        <div className="p-3">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-bold text-gray-900">Nueva Venta</h3>
            <button onClick={onClose} className="h-7 w-7 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition flex items-center justify-center">
              <span className="text-lg">×</span>
            </button>
          </div>

          {/* Datos básicos */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="block text-xs font-medium mb-0.5">Colaborador</label>
              <select
                value={ventaData.colaboradorId}
                onChange={(e) => setVentaData({ ...ventaData, colaboradorId: e.target.value })}
                className="w-full px-2 py-1 text-xs border rounded"
              >
                <option value="">Seleccione un colaborador</option>
                {colaboradores.map((colaborador) => (
                  <option key={colaborador._id} value={colaborador._id}>
                    {colaborador.nombre}
                  </option>
                ))}
              </select>
            </div>            <div>
              <label className="block text-xs font-medium mb-0.5">Fecha de Venta</label>
              <input
                type="datetime-local"
                value={ventaData.fechaVenta}
                onChange={(e) => setVentaData({ ...ventaData, fechaVenta: e.target.value })}
                className="w-full px-2 py-1 text-xs border rounded"
              />
            </div>
          </div>

          {/* Selector de Producto */}
          <div className="grid grid-cols-12 gap-1 mb-2">
            <div className="col-span-7">
              <select
                value={productoSeleccionado?._id || ""}
                onChange={(e) => {
                  const producto = productos.find(p => p._id === e.target.value);
                  setProductoSeleccionado(producto);
                  setCantidad(1);
                }}
                className="w-full px-2 py-1 text-xs border rounded"
              >
                <option value="">Seleccione un producto</option>
                {productos
                  .filter(p => p.cantidadRestante > 0)
                  .map((producto) => (
                    <option key={producto._id} value={producto._id}>
                      {producto.nombre} - Stock: {producto.cantidadRestante}
                    </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <input
                type="number"
                min="1"
                max={productoSeleccionado?.cantidadRestante || 1}
                value={cantidad}
                onChange={(e) => setCantidad(parseInt(e.target.value))}
                className="w-full px-2 py-1 text-xs border rounded"
                placeholder="Cant."
              />
            </div>
            <div className="col-span-3">
              <button
                onClick={() => {
                  if (productoSeleccionado && cantidad > 0) {
                    agregarAlCarrito(productoSeleccionado, cantidad);
                  }
                }}
                disabled={!productoSeleccionado || cantidad <= 0}
                className="w-full px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Carrito */}
          <CarritoProductos
            productos={carrito}
            onRemove={removerDelCarrito}
            onUpdateCantidad={actualizarCantidadEnCarrito}
          />

          {/* Resumen y Estado de Pago */}
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between items-center mb-1">
              <div>
                <select
                  value={ventaData.estadoPago}
                  onChange={(e) => setVentaData({ ...ventaData, estadoPago: e.target.value })}
                  className="px-2 py-1 text-xs border rounded"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Pagado">Pagado</option>
                  <option value="Anulado">Anulado</option>
                </select>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium">
                  Total: <span className="font-bold text-blue-700">S/ {resumen.total.toFixed(2)}</span>
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-1 mt-2">
              <button
                onClick={onClose}
                className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={carrito.length === 0 || !ventaData.colaboradorId || isSaving}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300"
              >
                {isSaving ? 'Guardando...' : 'Guardar Venta'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VentaModal;
