import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';

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
if (typeof document !== 'undefined' && !document.getElementById('devolucion-modal-styles')) {
  const style = document.createElement('style');
  style.id = 'devolucion-modal-styles';
  style.textContent = scrollStyles;
  document.head.appendChild(style);
}

// Iconos SVG
const ReturnIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PackageIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const WarningIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

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
      // Calcular cantidad disponible para devolución basada en devoluciones existentes
      const devolucionesPorProducto = (venta.devoluciones || [])
        .filter(dev => dev.productoId === detalle.productoId._id || dev.productoId === detalle.productoId);
      
      const cantidadDevuelta = devolucionesPorProducto
        .reduce((sum, dev) => sum + (dev.cantidadDevuelta || 0), 0);
      
      const cantidadDisponible = detalle.cantidad - cantidadDevuelta;
      
      return cantidadDisponible > 0;
    }).map(detalle => {
      const devolucionesPorProducto = (venta.devoluciones || [])
        .filter(dev => dev.productoId === detalle.productoId._id || dev.productoId === detalle.productoId);
      
      const cantidadDevuelta = devolucionesPorProducto
        .reduce((sum, dev) => sum + (dev.cantidadDevuelta || 0), 0);
      
      return {
        ...detalle,
        productoId: detalle.productoId._id || detalle.productoId,
        nombre: detalle.productoId?.nombre || detalle.nombre,
        cantidadDisponible: detalle.cantidad - cantidadDevuelta,
        precioUnitario: detalle.precioUnitario
      };
    });
  }, [venta]);
  const handleItemSelection = useCallback((detalle) => {
    const productoId = detalle.productoId;
    const existingItem = selectedItems.find(item => item.productoId === productoId);
    
    if (existingItem) {
      setSelectedItems(prev => prev.filter(item => item.productoId !== productoId));
    } else {
      setSelectedItems(prev => [...prev, {
        productoId: productoId,
        cantidadDevuelta: 1,
        montoDevolucion: detalle.precioUnitario,
        motivo: '',
        nombreProducto: detalle.nombre,
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

  if (!isVisible || !venta) return null;  if (availableProducts.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-xs border border-gray-200 animate-in slide-in-from-bottom-4 duration-300">
          <div className="p-3 text-center">
            <div className="mx-auto flex items-center justify-center h-10 w-10 rounded-full bg-yellow-100 mb-2">
              <WarningIcon />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">No hay productos disponibles</h3>
            <p className="text-sm text-gray-600 mb-3">
              Todos los productos ya han sido devueltos completamente.
            </p>
            <button
              onClick={handleClose}
              className="w-full px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md sm:max-w-lg max-h-[90vh] flex flex-col border border-gray-200 animate-in slide-in-from-bottom-4 duration-300">        {/* Header mejorado */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-3 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <ReturnIcon />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Procesar Devolución</h3>
                <div className="flex items-center gap-2 text-red-100 text-sm bg-white/10 px-2 py-1 rounded-md">
                  <CalendarIcon />
                  <span className="font-medium">{new Date(venta.fechaVenta || venta.fechadeVenta).toLocaleDateString()}</span>
                  <span className="text-white/60">•</span>
                  <UserIcon />
                  <span className="font-semibold">{venta.colaboradorId?.nombre}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              disabled={isProcesando}
            >
              <XIcon />
            </button>
          </div>
        </div>{/* Content compacto */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">          {/* Campo de fecha compacto */}
          <div className="bg-gray-50 px-3 py-2 border-b">
            <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <CalendarIcon />
              Fecha de Devolución
            </label>
            <input
              type="datetime-local"
              value={fechaDevolucion}
              onChange={(e) => setFechaDevolucion(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-red-400 focus:border-red-400"
              disabled={isProcesando}
            />
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar" style={{ maxHeight: 'calc(90vh - 150px)' }}>            <div className="mb-2">
              <h4 className="font-bold text-gray-800 text-base mb-1 flex items-center gap-1">
                <PackageIcon />
                Productos para Devolución
              </h4>
              <p className="text-sm text-gray-600">Seleccione los productos y complete la información</p>
            </div>{/* Lista de productos compacta */}
            <div className="space-y-2">
              {availableProducts.map((detalle, index) => {
                const selectedItem = selectedItems.find(item => item.productoId === detalle.productoId);
                const isSelected = !!selectedItem;
                return (
                  <div 
                    key={detalle.productoId || index} 
                    className={`border rounded-md p-2 transition-all duration-200 ${
                      isSelected 
                        ? 'border-red-200 bg-red-50' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleItemSelection(detalle)}
                        className="w-4 h-4 text-red-600 rounded focus:ring-red-500 border-gray-300 mt-0.5"
                      />
                        <div className="flex-1 min-w-0">                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900 text-base">{detalle.nombre}</h5>
                            <div className="text-sm text-gray-600 mt-0.5">
                              Disponible: {detalle.cantidadDisponible} • S/ {detalle.precioUnitario.toFixed(2)}
                            </div>
                          </div>
                          
                          {isSelected && (
                            <div className="ml-2 flex items-center gap-2">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                  Cantidad
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max={detalle.cantidadDisponible}
                                  value={selectedItem.cantidadDevuelta}
                                  onChange={(e) => updateSelectedItem(detalle.productoId, 'cantidadDevuelta', parseInt(e.target.value) || 1)}
                                  className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-red-400 focus:border-red-400 text-center font-medium"
                                />
                              </div>
                              <div className="text-sm font-bold text-red-700">
                                S/ {(selectedItem.cantidadDevuelta * selectedItem.precioUnitario).toFixed(2)}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {isSelected && (
                          <div className="mt-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                              Motivo de la devolución
                            </label>
                            <input
                              type="text"
                              placeholder="Ej: Producto defectuoso, cambio de opinión..."
                              value={selectedItem.motivo}
                              onChange={(e) => updateSelectedItem(detalle.productoId, 'motivo', e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-red-400 focus:border-red-400"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>          </div>
            {/* Footer compacto */}
          <div className="border-t border-gray-200 p-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-base font-bold text-red-600">
                Total a Devolver: S/ {calculateTotal.toFixed(2)}
              </div>
              {selectedItems.length > 0 && (
                <div className="text-sm text-gray-600">
                  {selectedItems.length} producto{selectedItems.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors text-sm font-medium"
                disabled={isProcesando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isProcesando || selectedItems.length === 0}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-1 text-sm font-semibold"
              >
                {isProcesando ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <ReturnIcon />
                    Procesar Devolución
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DevolucionModal;
