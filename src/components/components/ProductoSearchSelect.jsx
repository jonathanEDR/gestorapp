import React, { useState, useRef, useEffect } from 'react';

const ProductoSearchSelect = ({ 
  productos, 
  selectedProductoId, 
  onProductoChange, 
  placeholder = "Buscar producto..." 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Filtrar productos basado en el término de búsqueda
  const filteredProductos = productos
    .filter((producto) => producto.cantidad - producto.cantidadVendida > 0)
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
      <input
        ref={searchInputRef}
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        autoComplete="off"
      />
      
      {/* Icono de búsqueda */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Dropdown con resultados */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredProductos.length > 0 ? (
            filteredProductos.map((producto, index) => (
              <div
                key={producto._id}
                onClick={() => handleProductoSelect(producto)}
                className={`px-4 py-2 cursor-pointer transition-colors ${
                  index === highlightedIndex 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'hover:bg-gray-100'
                } ${selectedProductoId === producto._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{producto.nombre}</span>
                  <span className="text-sm text-gray-500">
                    Stock: {producto.cantidad - producto.cantidadVendida}
                  </span>
                </div>
                {/* Mostrar precio si está disponible */}
                {producto.precio && (
                  <div className="text-xs text-gray-400 mt-1">
                    Precio: S/ {producto.precio.toFixed(2)}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500 text-sm">
              {searchTerm ? 'No se encontraron productos' : 'No hay productos disponibles'}
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

      <div className="mt-6 text-sm text-gray-600">
        <h3 className="font-medium mb-2">Características:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Búsqueda en tiempo real por nombre</li>
          <li>Navegación con teclado (↑↓ Enter Esc)</li>
          <li>Filtrado automático por stock disponible</li>
          <li>Muestra información adicional (stock, precio)</li>
          <li>Interfaz responsive y accesible</li>
        </ul>
      </div>
    </div>
  );
};

export default ProductoSearchSelect;