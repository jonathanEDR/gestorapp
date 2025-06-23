// Hook personalizado para manejar filtros en URL
import { useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';

export const useUrlFilters = (defaultFilters = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Obtener filtros actuales de la URL
  const filters = useMemo(() => {
    const urlFilters = {};
    for (const [key, defaultValue] of Object.entries(defaultFilters)) {
      const urlValue = searchParams.get(key);
      
      if (urlValue !== null) {
        // Convertir según el tipo del valor por defecto
        if (typeof defaultValue === 'number') {
          urlFilters[key] = parseInt(urlValue) || defaultValue;
        } else if (typeof defaultValue === 'boolean') {
          urlFilters[key] = urlValue === 'true';
        } else {
          urlFilters[key] = urlValue;
        }
      } else {
        urlFilters[key] = defaultValue;
      }
    }
    return urlFilters;
  }, [searchParams, defaultFilters]);

  // Función para actualizar filtros
  const updateFilters = (newFilters) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        newParams.set(key, value.toString());
      } else {
        newParams.delete(key);
      }
    });
    
    setSearchParams(newParams);
  };

  // Función para resetear filtros
  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return {
    filters,
    updateFilters,
    resetFilters
  };
};
