import React, { useState, useRef, useEffect } from 'react';

const ProductoSearchSelect = ({ 
  productos, 
  selectedProductoId, 
  onProductoChange, 
  placeholder = "Buscar producto...",
  compact = false // Nueva prop para versión compacta
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  // Filtrar productos basado en el término de búsqueda
  const filteredProductos = productos
    .filter((producto) => {
      // Verificar stock disponible - usar cantidadRestante si existe, sino calcular
      const stockDisponible = producto.cantidadRestante !== undefined 
        ? producto.cantidadRestante 
        : producto.cantidad - (producto.cantidadVendida || 0);
      return stockDisponible > 0;
    })
    .filter((producto) => 
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Encontrar el producto seleccionado para mostrar su nombre
  const selectedProducto = productos.find(p => p._id === selectedProductoId);

  // Actualizar el término de búsqueda cuando se selecciona un producto
  useEffect(() => {
    if (selectedProducto) {
      setSearchTerm(selectedProducto.nombre);
    } else {
      setSearchTerm('');
    }
  }, [selectedProducto]);

  // Manejar la selección de un producto
  const handleProductoSelect = (producto) => {
    onProductoChange({ target: { value: producto._id } });
    setSearchTerm(producto.nombre);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };
  // Manejar cambios en el input de búsqueda
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(true);
    setHighlightedIndex(-1);
    
    // Si se borra el texto, limpiar la selección
    if (value === '') {
      onProductoChange({ target: { value: '' } });
    } else {
      // Auto-seleccionar si hay una coincidencia exacta
      const coincidenciaExacta = filteredProductos.find(p => 
        p.nombre.toLowerCase() === value.toLowerCase()
      );
      if (coincidenciaExacta) {
        onProductoChange({ target: { value: coincidenciaExacta._id } });
      }
    }
  };
  // Manejar navegación con teclado
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
      return;
    }

    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        // Auto-completar con la primera coincidencia si hay una
        if (filteredProductos.length > 0 && searchTerm && !selectedProducto) {
          handleProductoSelect(filteredProductos[0]);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredProductos.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredProductos[highlightedIndex]) {
          handleProductoSelect(filteredProductos[highlightedIndex]);
        } else if (filteredProductos.length === 1) {
          // Si solo hay una opción, seleccionarla
          handleProductoSelect(filteredProductos[0]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        searchInputRef.current?.blur();
        break;
    }
  };

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={searchInputRef}
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
            compact 
              ? 'px-3 py-2 text-sm pr-8' 
              : 'px-4 py-3 pr-10'
          } ${
            searchTerm && !selectedProducto 
              ? 'border-amber-300 bg-amber-50 ring-1 ring-amber-200' 
              : ''
          } ${
            selectedProducto 
              ? 'border-green-300 bg-green-50 ring-1 ring-green-200' 
              : ''
          }`}
          autoComplete="off"
        />
        
        {/* Icono de búsqueda o check */}
        <div className={`absolute inset-y-0 right-0 flex items-center pointer-events-none ${
          compact ? 'pr-3' : 'pr-3'
        }`}>
          {selectedProducto ? (
            <svg className={`text-green-500 ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className={`text-gray-400 ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* Dropdown con resultados */}
      {isOpen && (        <div className={`absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-auto custom-scrollbar ${
          compact ? 'text-sm' : ''
        }`}>
          {filteredProductos.length > 0 ? (
            <div className="py-1">
              {filteredProductos.map((producto, index) => (
                <div
                  key={producto._id}
                  onClick={() => handleProductoSelect(producto)}
                  className={`cursor-pointer transition-all duration-150 ${
                    compact 
                      ? 'px-3 py-2' 
                      : 'px-4 py-3'
                  } ${
                    index === highlightedIndex 
                      ? 'bg-blue-50 text-blue-900 border-r-2 border-blue-500' 
                      : 'hover:bg-gray-50'
                  } ${
                    selectedProductoId === producto._id 
                      ? 'bg-green-50 border-r-2 border-green-500 text-green-900' 
                      : ''
                  }`}
                >                  <div className="flex items-center justify-between">
                    <span className={`font-medium text-gray-800 truncate ${compact ? 'text-sm' : 'text-base'}`}>
                      {producto.nombre}
                    </span>
                    {selectedProductoId === producto._id && (
                      <svg className="w-4 h-4 text-green-500 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-gray-500 text-center py-6 ${compact ? 'px-3 text-sm' : 'px-4'}`}>
              <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p>{searchTerm ? 'No se encontraron productos' : 'No hay productos disponibles'}</p>
              {searchTerm && (
                <p className="text-xs text-gray-400 mt-1">
                  Intente con otro término de búsqueda
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Ejemplo de uso del componente
const EjemploUso = () => {
  const [selectedProductoId, setSelectedProductoId] = useState('');
  
  // Datos de ejemplo
  const productos = [
    { _id: '1', nombre: 'Laptop Dell Inspiron', cantidad: 10, cantidadVendida: 3, precio: 2500 },
    { _id: '2', nombre: 'Mouse Logitech', cantidad: 50, cantidadVendida: 20, precio: 45 },
    { _id: '3', nombre: 'Teclado Mecánico', cantidad: 25, cantidadVendida: 15, precio: 120 },
    { _id: '4', nombre: 'Monitor Samsung 24"', cantidad: 8, cantidadVendida: 2, precio: 300 },
    { _id: '5', nombre: 'Auriculares Sony', cantidad: 0, cantidadVendida: 0, precio: 80 }
  ];

  const handleProductoChange = (e) => {
    setSelectedProductoId(e.target.value);
    console.log('Producto seleccionado:', e.target.value);
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Ejemplo de Búsqueda de Productos</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar Producto
        </label>
        <ProductoSearchSelect
          productos={productos}
          selectedProductoId={selectedProductoId}
          onProductoChange={handleProductoChange}
          placeholder="Buscar producto por nombre..."
        />
      </div>

      {selectedProductoId && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            Producto seleccionado: {productos.find(p => p._id === selectedProductoId)?.nombre}
          </p>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-600">        <h3 className="font-medium mb-2">Características:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Búsqueda en tiempo real por nombre</li>
          <li>Navegación con teclado (↑↓ Enter Esc)</li>
          <li>Filtrado automático por stock disponible</li>
          <li>Interfaz compacta con solo el nombre</li>
          <li>Diseño responsivo y accesible</li>
        </ul>
      </div>
    </div>
  );
};

export default ProductoSearchSelect;