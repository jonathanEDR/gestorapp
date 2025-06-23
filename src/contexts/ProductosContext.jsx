// Context para manejar estado global de productos
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api from '../services/api';

// Estado inicial
const initialState = {
  productos: [],
  productosTerminados: [],
  isLoading: false,
  error: null,
  filters: {
    search: '',
    category: '',
    minStock: 0,
    maxStock: 1000
  }
};

// Acciones
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_PRODUCTOS: 'SET_PRODUCTOS',
  SET_ERROR: 'SET_ERROR',
  ADD_PRODUCTO: 'ADD_PRODUCTO',
  UPDATE_PRODUCTO: 'UPDATE_PRODUCTO',
  DELETE_PRODUCTO: 'DELETE_PRODUCTO',
  SET_FILTERS: 'SET_FILTERS'
};

// Reducer
const productosReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    
    case ACTIONS.SET_PRODUCTOS:
      return { 
        ...state, 
        productos: action.payload.activos,
        productosTerminados: action.payload.terminados,
        isLoading: false,
        error: null
      };
    
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };
    
    case ACTIONS.ADD_PRODUCTO:
      return { 
        ...state, 
        productos: [...state.productos, action.payload] 
      };
    
    case ACTIONS.UPDATE_PRODUCTO:
      return {
        ...state,
        productos: state.productos.map(p => 
          p._id === action.payload._id ? action.payload : p
        )
      };
    
    case ACTIONS.DELETE_PRODUCTO:
      return {
        ...state,
        productos: state.productos.filter(p => p._id !== action.payload)
      };
    
    case ACTIONS.SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      };
    
    default:
      return state;
  }
};

// Context
const ProductosContext = createContext();

// Provider
export const ProductosProvider = ({ children }) => {
  const [state, dispatch] = useReducer(productosReducer, initialState);
  const { getToken } = useAuth();

  // Cargar productos
  const fetchProductos = async () => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      
      const token = await getToken();
      if (!token) {
        throw new Error('No autorizado');
      }

      const response = await api.get('/productos', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const productosActivos = [];
      const productosTerminados = [];

      response.data.forEach((producto) => {
        if (producto.cantidadRestante === 0) {
          productosTerminados.push({
            ...producto,
            fechaAgotamiento: new Date().toLocaleString(),
          });
        } else {
          productosActivos.push(producto);
        }
      });

      dispatch({
        type: ACTIONS.SET_PRODUCTOS,
        payload: { activos: productosActivos, terminados: productosTerminados }
      });

    } catch (error) {
      dispatch({
        type: ACTIONS.SET_ERROR,
        payload: error.message || 'Error al cargar productos'
      });
    }
  };

  // Agregar producto
  const addProducto = async (productoData) => {
    try {
      const token = await getToken();
      const response = await api.post('/productos', productoData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      dispatch({
        type: ACTIONS.ADD_PRODUCTO,
        payload: response.data
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Actualizar producto
  const updateProducto = async (id, productoData) => {
    try {
      const token = await getToken();
      const response = await api.put(`/productos/${id}`, productoData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      dispatch({
        type: ACTIONS.UPDATE_PRODUCTO,
        payload: response.data
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Eliminar producto
  const deleteProducto = async (id) => {
    try {
      const token = await getToken();
      await api.delete(`/productos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      dispatch({
        type: ACTIONS.DELETE_PRODUCTO,
        payload: id
      });
    } catch (error) {
      throw error;
    }
  };

  // Actualizar filtros
  const updateFilters = (newFilters) => {
    dispatch({
      type: ACTIONS.SET_FILTERS,
      payload: newFilters
    });
  };

  const value = {
    ...state,
    fetchProductos,
    addProducto,
    updateProducto,
    deleteProducto,
    updateFilters
  };

  return (
    <ProductosContext.Provider value={value}>
      {children}
    </ProductosContext.Provider>
  );
};

// Hook para usar el context
export const useProductos = () => {
  const context = useContext(ProductosContext);
  if (!context) {
    throw new Error('useProductos debe ser usado dentro de ProductosProvider');
  }
  return context;
};
