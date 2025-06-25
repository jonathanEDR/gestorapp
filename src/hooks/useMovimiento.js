import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '@clerk/clerk-react';

export const useMovimiento = () => {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);  // Mapear categorías del modal a valores del backend
  const mapearCategoriaAMovimientoCaja = (categoria) => {
    // Ya no hacer mapeo - usar la categoría original directamente
    // Esto mantiene la trazabilidad completa
    return categoria;
  };

  // Mapear categorías del modal a valores para Gastos
  const mapearCategoriaAGasto = (categoria) => {
    // Extraer el tipo y la sección de la categoría
    if (categoria.includes('pago_personal')) {
      const seccion = categoria.split('_').pop(); // última parte después del último _
      const gastoMap = {
        'finanzas': 'Finanzas',
        'produccion': 'Producción', 
        'ventas': 'Ventas',
        'admin': 'Administración',
        'administrativo': 'Administración'
      };
      return {
        tipoDeGasto: 'Pago Personal',
        gasto: gastoMap[seccion] || 'Administración'
      };
    }
    
    if (categoria.includes('materia_prima')) {
      const seccion = categoria.split('_')[2]; // tercera parte
      const gastoMap = {
        'finanzas': 'Finanzas',
        'produccion': 'Producción',
        'ventas': 'Ventas',
        'admin': 'Administración',
        'administrativo': 'Administración'
      };
      return {
        tipoDeGasto: 'Materia Prima',
        gasto: gastoMap[seccion] || 'Producción'
      };
    }
    
    if (categoria.includes('otros')) {
      const seccion = categoria.split('_').pop();
      const gastoMap = {
        'finanzas': 'Finanzas',
        'produccion': 'Producción',
        'ventas': 'Ventas', 
        'admin': 'Administración',
        'administrativo': 'Administración'
      };
      return {
        tipoDeGasto: 'Otros',
        gasto: gastoMap[seccion] || 'Administración'
      };
    }
    
    // Fallback por defecto
    return {
      tipoDeGasto: 'Otros',
      gasto: 'Administración'
    };
  };
  // Verificar si una categoría debe registrarse también como gasto
  const debeRegistrarseComoGasto = (categoria) => {
    // TODOS los tipos deben registrarse tanto en Caja como en Gastos
    return true;
  };const registrarMovimiento = async (movimientoData, onSuccess) => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('No autorizado');

      const monto = parseFloat(movimientoData.monto);
      if (monto <= 0) {
        throw new Error('El monto debe ser mayor a 0');
      }      // Mapear las categorías para ambos sistemas
      const categoriaMovimiento = mapearCategoriaAMovimientoCaja(movimientoData.categoria);
      const gastoMapeado = mapearCategoriaAGasto(movimientoData.categoria);

      // Preparar datos para caja - usando la categoría mapeada para MovimientoCaja
      const cajaData = {
        tipo: movimientoData.tipo,
        categoria: categoriaMovimiento, // Usar categoría específica para MovimientoCaja
        descripcion: movimientoData.descripcion,
        monto: monto,
        fecha: movimientoData.fecha,
        metodoPago: movimientoData.metodoPago,
        colaboradorNombre: movimientoData.colaboradorNombre,
        proveedor: movimientoData.proveedor,
        numeroComprobante: movimientoData.numeroComprobante,
        observaciones: movimientoData.observaciones
      };      // Agregar la sección mapeada a los datos de caja para que el backend pueda crear el Gasto automáticamente
      const seccionFromCategoria = movimientoData.categoria.split('_').pop();
      cajaData.seccion = seccionFromCategoria;



      // Registrar en caja - el backend creará automáticamente el Gasto correspondiente
      await api.post('/caja/movimiento', cajaData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      console.error('Error al registrar movimiento:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error al registrar movimiento';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };  return {
    registrarMovimiento,
    loading,
    error,
    setError
  };
};
