import React, { useState, useRef, useEffect } from 'react';

const ColaboradorSearchSelect = ({ 
  colaboradores, 
  selectedColaboradorId, 
  onColaboradorChange, 
  placeholder = "Buscar colaborador...",
  compact = false // Nueva prop para versión compacta
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Filtrar colaboradores basado en el término de búsqueda
  const filteredColaboradores = colaboradores
    .filter((colaborador) => 
      colaborador.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Encontrar el colaborador seleccionado para mostrar su nombre
  const selectedColaborador = colaboradores.find(c => c._id === selectedColaboradorId);

  // Actualizar el término de búsqueda cuando se selecciona un colaborador
  useEffect(() => {
    if (selectedColaborador) {
      setSearchTerm(selectedColaborador.nombre);
    } else {
      setSearchTerm('');
    }
  }, [selectedColaborador]);

  // Manejar la selección de un colaborador
  const handleColaboradorSelect = (colaborador) => {
    onColaboradorChange({ target: { value: colaborador._id } });
    setSearchTerm(colaborador.nombre);
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
      onColaboradorChange({ target: { value: '' } });
    } else {
      // Auto-seleccionar si hay una coincidencia exacta
      const coincidenciaExacta = filteredColaboradores.find(c => 
        c.nombre.toLowerCase() === value.toLowerCase()
      );
      if (coincidenciaExacta) {
        onColaboradorChange({ target: { value: coincidenciaExacta._id } });
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
        if (filteredColaboradores.length > 0 && searchTerm && !selectedColaborador) {
          handleColaboradorSelect(filteredColaboradores[0]);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredColaboradores.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredColaboradores[highlightedIndex]) {
          handleColaboradorSelect(filteredColaboradores[highlightedIndex]);
        } else if (filteredColaboradores.length === 1) {
          // Si solo hay una opción, seleccionarla
          handleColaboradorSelect(filteredColaboradores[0]);
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
          className={`w-full border border-gray-300 rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 ${
            compact 
              ? 'px-3 py-2 text-sm pr-8' 
              : 'px-4 py-3 pr-10'
          } ${
            searchTerm && !selectedColaborador 
              ? 'border-amber-300 bg-amber-50 ring-1 ring-amber-200' 
              : ''
          } ${
            selectedColaborador 
              ? 'border-green-300 bg-green-50 ring-1 ring-green-200' 
              : ''
          }`}
          autoComplete="off"
        />
        
        {/* Icono de usuario o check */}
        <div className={`absolute inset-y-0 right-0 flex items-center pointer-events-none ${
          compact ? 'pr-3' : 'pr-3'
        }`}>
          {selectedColaborador ? (
            <svg className={`text-green-500 ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className={`text-gray-400 ${compact ? 'w-4 h-4' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </div>
      </div>

      {/* Dropdown con resultados */}
      {isOpen && (
        <div className={`absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded shadow-xl max-h-48 overflow-auto custom-scrollbar ${
          compact ? 'text-sm' : ''
        }`}>
          {filteredColaboradores.length > 0 ? (
            <div className="py-1">
              {filteredColaboradores.map((colaborador, index) => (
                <div
                  key={colaborador._id}
                  onClick={() => handleColaboradorSelect(colaborador)}
                  className={`cursor-pointer transition-all duration-150 ${
                    compact 
                      ? 'px-3 py-2' 
                      : 'px-4 py-3'
                  } ${
                    index === highlightedIndex 
                      ? 'bg-blue-50 text-blue-900 border-r-2 border-blue-500' 
                      : 'hover:bg-gray-50'
                  } ${
                    selectedColaboradorId === colaborador._id 
                      ? 'bg-green-50 border-r-2 border-green-500 text-green-900' 
                      : ''
                  }`}
                >                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold truncate ${compact ? 'text-sm' : 'text-base'}`}>
                        {colaborador.nombre}
                      </span>
                      {selectedColaboradorId === colaborador._id && (
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-gray-500 text-center py-4 ${compact ? 'px-3 text-sm' : 'px-4'}`}>
              <svg className="w-6 h-6 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p>{searchTerm ? 'No se encontraron colaboradores' : 'No hay colaboradores disponibles'}</p>
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

export default ColaboradorSearchSelect;
