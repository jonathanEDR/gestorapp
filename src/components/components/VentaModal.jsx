import React, { useState } from 'react';
import { toast } from 'react-toastify';
import ProductoSearchSelect from './ProductoSearchSelect';
import ColaboradorSearchSelect from './ColaboradorSearchSelect';

// Estilos para scroll personalizado
const scrollStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 2px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

// Inyectar estilos
if (typeof document !== 'undefined' && !document.getElementById('venta-modal-styles')) {
  const style = document.createElement('style');
  style.id = 'venta-modal-styles';
  style.textContent = scrollStyles;
  document.head.appendChild(style);
}

// Iconos SVG simples
const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ShoppingCartIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0L17 18m0 0v2a2 2 0 002 2v0a2 2 0 00-2-2m-6 0h6" />
  </svg>
);

const CreditCardIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Función para obtener fecha actual en formato datetime-local
const getFechaActualLocal = () => {
  const ahora = new Date();
  // Ajustar a zona horaria local
  const fechaLocal = new Date(ahora.getTime() - (ahora.getTimezoneOffset() * 60000));
  return fechaLocal.toISOString().slice(0, 16);
};

const CarritoProductos = ({ productos, onRemove, onUpdateCantidad }) => {
  if (productos.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-3 text-center">
        <div className="mx-auto w-5 h-5 text-gray-400 mb-2 flex items-center justify-center">
          <ShoppingCartIcon />
        </div>
        <p className="text-sm text-gray-500">No hay productos en el carrito</p>
        <p className="text-xs text-gray-400 mt-1">Agregue productos para comenzar</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <ShoppingCartIcon />
        <h4 className="text-base font-bold text-gray-800">Carrito</h4>
        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
          {productos.length}
        </span>
      </div>
      
      <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
        {productos.map((item, index) => (
          <div key={index} className="bg-white rounded-md p-2 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-2">
                <h5 className="text-sm font-semibold text-gray-900 truncate">{item.nombre}</h5>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-600">S/ {item.precioUnitario.toFixed(2)}</span>
                  <span className="text-xs text-gray-400">×</span>
                  <input
                    type="number"
                    min="1"
                    value={item.cantidad}
                    onChange={(e) => onUpdateCantidad(index, e.target.value)}
                    className="w-12 px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent text-center"
                  />
                  <span className="text-xs text-gray-400">=</span>
                  <span className="text-sm font-bold text-green-600">
                    S/ {item.subtotal.toFixed(2)}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => onRemove(index)}
                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                title="Eliminar producto"
              >
                <TrashIcon />
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
  if (!isVisible) return null;  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md sm:max-w-lg max-h-[90vh] flex flex-col border border-gray-200 animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header mejorado */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <ShoppingCartIcon />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Nueva Venta</h3>
                <div className="flex items-center gap-2 text-blue-100 text-sm bg-white/10 px-2 py-1 rounded-md">
                  <CalendarIcon />
                  <span className="font-medium">Sistema de Ventas</span>
                  <span className="text-white/60">•</span>
                  <UserIcon />
                  <span className="font-semibold">Crear Venta</span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <XIcon />
            </button>
          </div>
        </div>        {/* Content compacto */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar" style={{ maxHeight: 'calc(90vh - 150px)' }}>
          
          {/* Datos básicos compactos */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-1">
              <UserIcon />
              Información de Venta
            </h4>
              <div className="grid grid-cols-1 gap-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Colaborador
                </label>
                <ColaboradorSearchSelect
                  colaboradores={colaboradores}
                  selectedColaboradorId={ventaData.colaboradorId}
                  onColaboradorChange={(e) => setVentaData({ ...ventaData, colaboradorId: e.target.value })}
                  placeholder="Buscar colaborador por nombre..."
                  compact={true}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Fecha de Venta
                  </label>
                  <input
                    type="datetime-local"
                    value={ventaData.fechaVenta}
                    onChange={(e) => setVentaData({ ...ventaData, fechaVenta: e.target.value })}
                    className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={ventaData.estadoPago}
                    onChange={(e) => setVentaData({ ...ventaData, estadoPago: e.target.value })}
                    className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-400 focus:border-blue-400 appearance-none bg-white"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Pagado">Pagado</option>
                    <option value="Anulado">Anulado</option>
                  </select>
                </div>
              </div>
            </div>
          </div>          {/* Agregar Productos compacto */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-1">
              <PlusIcon />
              Agregar Productos
            </h4>
            
            <div className="space-y-2">
              <ProductoSearchSelect
                productos={productos}
                selectedProductoId={productoSeleccionado?._id || ""}
                onProductoChange={(e) => {
                  const producto = productos.find(p => p._id === e.target.value);
                  setProductoSeleccionado(producto);
                  setCantidad(1);
                }}
                placeholder="Buscar producto por nombre..."
                compact={true}
              />
              
              {productoSeleccionado && (
                <div className="bg-white p-2 rounded-md border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{productoSeleccionado.nombre}</p>
                      <p className="text-xs text-gray-600">
                        S/ {productoSeleccionado.precio} • Stock: {productoSeleccionado.cantidadRestante}
                      </p>
                    </div>
                    <div className="ml-2 flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max={productoSeleccionado?.cantidadRestante || 1}
                        value={cantidad}
                        onChange={(e) => setCantidad(parseInt(e.target.value))}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400 text-center"
                        placeholder="Cant."
                      />
                      <button
                        onClick={() => {
                          if (productoSeleccionado && cantidad > 0) {
                            agregarAlCarrito(productoSeleccionado, cantidad);
                          }
                        }}
                        disabled={!productoSeleccionado || cantidad <= 0}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 transition-colors flex items-center gap-1 text-sm font-semibold"
                      >
                        <PlusIcon />
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Carrito */}
          <CarritoProductos
            productos={carrito}
            onRemove={removerDelCarrito}
            onUpdateCantidad={actualizarCantidadEnCarrito}
          />          {/* Resumen compacto */}
          {carrito.length > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-2 border border-green-200">
              <div className="flex items-center justify-between">
                <div className="text-base font-bold text-green-600">
                  Total: S/ {resumen.total.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">
                  {carrito.length} producto{carrito.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer compacto */}
        <div className="border-t border-gray-200 p-2">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={carrito.length === 0 || !ventaData.colaboradorId || isSaving}
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-1 text-sm font-semibold"
            >
              {isSaving ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <ShoppingCartIcon />
                  Guardar Venta
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VentaModal;
