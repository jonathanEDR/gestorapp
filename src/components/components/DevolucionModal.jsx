import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';

// Función para obtener fecha actual en formato datetime-local
const getFechaActualLocal = () => {
  const ahora = new Date();
  const fechaLocal = new Date(ahora.getTime() - (ahora.getTimezoneOffset() * 60000));
  return fechaLocal.toISOString().slice(0, 16);
};

const DevolucionModal = ({ isVisible, onClose, venta, onProcesarDevolucion, isProcesando }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [fechaDevolucion, setFechaDevolucion] = useState(getFechaActualLocal());
  // Resetear cuando se abre el modal
  useEffect(() => {
    if (isVisible) {
      setSelectedItems([]);
      setFechaDevolucion(getFechaActualLocal()); // Resetear fecha también
    }
  }, [isVisible]);

  // Memoizar productos disponibles para devolución
  const availableProducts = useMemo(() => {
    if (!venta?.detalles) return [];
    
    return venta.detalles.filter(detalle => {
      // Calcular cantidad disponible para devolución
      const devoluciones = venta.devoluciones || [];
      const cantidadDevuelta = devoluciones
        .filter(dev => dev.productoId === detalle.productoId)
        .reduce((sum, dev) => sum + dev.cantidadDevuelta, 0);
      
      return detalle.cantidad > cantidadDevuelta;
    }).map(detalle => {
      const devoluciones = venta.devoluciones || [];
      const cantidadDevuelta = devoluciones
        .filter(dev => dev.productoId === detalle.productoId)
        .reduce((sum, dev) => sum + dev.cantidadDevuelta, 0);
      
      return {
        ...detalle,
        cantidadDisponible: detalle.cantidad - cantidadDevuelta
      };
    });
  }, [venta]);

  const handleItemSelection = useCallback((detalle) => {
    const existingItem = selectedItems.find(item => item.productoId === detalle.productoId);
    
    if (existingItem) {
      setSelectedItems(prev => prev.filter(item => item.productoId !== detalle.productoId));
    } else {
      setSelectedItems(prev => [...prev, {
        productoId: detalle.productoId,
        cantidadDevuelta: 1,
        montoDevolucion: detalle.precioUnitario,
        motivo: '',
        nombreProducto: detalle.nombre || detalle.productoId?.nombre,
        cantidadOriginal: detalle.cantidad,
        cantidadDisponible: detalle.cantidadDisponible,
        precioUnitario: detalle.precioUnitario
      }]);
    }
  }, [selectedItems]);
  const updateSelectedItem = useCallback((productoId, field, value) => {
    setSelectedItems(items =>
      items.map(item =>
        item.productoId === productoId
          ? { ...item, [field]: value }
          : item
      )
    );
  }, []);

  const handleClose = useCallback(() => {
    setSelectedItems([]);
    setFechaDevolucion(getFechaActualLocal());
    onClose();
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (selectedItems.length === 0) {
        toast.error('Seleccione al menos un producto para devolver');
        return;
      }

      for (const item of selectedItems) {
        if (!item.motivo.trim()) {
          toast.error(`Ingrese un motivo para ${item.nombreProducto}`);
          return;
        }
        if (item.cantidadDevuelta <= 0 || item.cantidadDevuelta > item.cantidadDisponible) {
          toast.error(`Cantidad inválida para ${item.nombreProducto}. Disponible: ${item.cantidadDisponible}`);
          return;
        }
      }      const devolucionPayload = {
        ventaId: venta._id,
        fechaDevolucion: fechaDevolucion ? new Date(fechaDevolucion).toISOString() : new Date().toISOString(),
        items: selectedItems.map(item => ({
          productoId: item.productoId,
          cantidadDevuelta: item.cantidadDevuelta,
          montoDevolucion: item.precioUnitario * item.cantidadDevuelta,
          motivo: item.motivo
        }))
      };      await onProcesarDevolucion(devolucionPayload);
      setSelectedItems([]);
      setFechaDevolucion(getFechaActualLocal()); // Resetear fecha también
      onClose();
    } catch (error) {
      console.error('Error al procesar devolución:', error);
      toast.error('Error al procesar la devolución');
    }
  };

  const calculateTotal = useMemo(() => {
    return selectedItems.reduce((total, item) => 
      total + (item.cantidadDevuelta * item.precioUnitario), 0
    );
  }, [selectedItems]);

  if (!isVisible || !venta) return null;

  if (availableProducts.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos disponibles</h3>
            <p className="text-sm text-gray-600 mb-4">
              Todos los productos de esta venta ya han sido devueltos completamente.
            </p>            <button
              onClick={handleClose}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white/30 flex items-center justify-center z-50 p-1">
      <div className="bg-white rounded-md shadow w-full max-w-md max-h-[90vh] flex flex-col border border-gray-200">
        {/* Header Compacto */}
        <div className="flex items-center justify-between p-3 border-b bg-gray-50 rounded-t-md">
          <div>
            <h3 className="text-base font-bold text-gray-900">Procesar Devolución</h3>            <p className="text-xs text-gray-500">
              {new Date(venta.fechaVenta || venta.fechadeVenta).toLocaleDateString()} • {venta.colaboradorId?.nombre}
            </p>
          </div>          <button
            onClick={handleClose}
            className="h-7 w-7 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition"
            disabled={isProcesando}
            aria-label="Cerrar"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Campo de fecha de devolución */}
          <div className="px-3 py-2 border-b bg-gray-50">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Fecha de Devolución
            </label>
            <input
              type="datetime-local"
              value={fechaDevolucion}
              onChange={(e) => setFechaDevolucion(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              disabled={isProcesando}
            />
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 bg-white rounded-b-md">
            <div className="mb-2">
              <h4 className="font-semibold text-gray-800 text-sm mb-0.5">Productos para devolución</h4>
              <p className="text-xs text-gray-400">Seleccione y complete los datos</p>
            </div>
            {/* Lista responsiva y compacta */}
            <div className="space-y-2">
              {availableProducts.map((detalle, index) => {
                const selectedItem = selectedItems.find(item => item.productoId === detalle.productoId);
                const isSelected = !!selectedItem;
                return (
                  <div key={detalle.productoId || index} className={`border rounded px-2 py-1 flex flex-col gap-1 ${isSelected ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleItemSelection(detalle)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-xs">{detalle.nombre || detalle.productoId?.nombre}</div>
                        <div className="text-[10px] text-gray-500">Disp: {detalle.cantidadDisponible} • S/ {detalle.precioUnitario.toFixed(2)}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                        <input
                          type="number"
                          min="1"
                          max={detalle.cantidadDisponible}
                          value={selectedItem.cantidadDevuelta}
                          onChange={(e) => updateSelectedItem(detalle.productoId, 'cantidadDevuelta', parseInt(e.target.value) || 1)}
                          className="w-full sm:w-14 px-1 py-0.5 border border-gray-300 rounded text-center text-xs focus:ring-1 focus:ring-blue-400"
                        />
                        <input
                          type="text"
                          placeholder="Motivo..."
                          value={selectedItem.motivo}
                          onChange={(e) => updateSelectedItem(detalle.productoId, 'motivo', e.target.value)}
                          className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-400"
                        />
                        <div className="text-xs text-blue-700 font-bold text-right w-full sm:w-auto">
                          S/ {(selectedItem.cantidadDevuelta * selectedItem.precioUnitario).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Footer compacto */}
          <div className="border-t bg-gray-50 rounded-b-md p-2 flex flex-col sm:flex-row gap-1 sm:justify-between items-center">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-700">Total:</span>
              <span className="text-base font-bold text-blue-700">S/ {calculateTotal.toFixed(2)}</span>
            </div>
            <div className="flex gap-1 w-full sm:w-auto">              <button
                type="button"
                onClick={handleClose}
                className="flex-1 sm:flex-none px-2 py-1 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 text-xs font-medium"
                disabled={isProcesando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isProcesando || selectedItems.length === 0}
                className="flex-1 sm:flex-none px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-xs font-medium"
              >
                {isProcesando ? 'Procesando...' : 'Procesar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DevolucionModal;
