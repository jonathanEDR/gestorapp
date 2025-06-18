import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true   // Permite enviar cookies junto con cada petición
});

// Obtener todos los productos (inventario)
export const getProductos = async () => {
  try {
    const response = await api.get('/productos');  // Usando la instancia api
    return response.data;
  } catch (error) {
    console.error('Error al obtener productos:', error);
    throw error;
  }
};

// Crear un nuevo producto (registrar producto)
export const createProducto = async (producto) => {
  try {
    const response = await api.post('/productos', producto);  // Usando la instancia api
    return response.data;
  } catch (error) {
    console.error('Error al agregar producto:', error);
    throw error;
  }
};

// Crear una nueva venta
export const createVenta = async (venta) => {
  try {
    // Usar la instancia api configurada en lugar de axios directamente
    const response = await api.post('/ventas', venta);
    
    // Verificar si la respuesta contiene datos
    if (!response.data) {
      throw new Error('No se recibieron datos del servidor');
    }
    
    // Verificar si los datos de la venta están completos
    if (!response.data.colaboradorId || !response.data.productoId) {
      throw new Error('Los datos de la venta están incompletos');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error al agregar venta:', error.message);
    throw new Error(`Error al crear la venta: ${error.message}`);
  }
};

// Funciones para manejo de ventas
export const ventasAPI = {
  obtenerVenta: async (id, token) => {
    try {
      const response = await api.get(`/ventas/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener venta:', error);
      throw error;
    }
  },
  eliminarVenta: async (id, token) => {
    try {
      const response = await api.delete(`/ventas/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error al eliminar venta:', error);
      throw error;
    }
  },

  actualizarStockProducto: async (productoId, cantidad, token) => {
    try {
      const response = await api.put(`/productos/${productoId}`, 
        { incrementoStock: cantidad },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error al actualizar stock:', error);
      throw error;
    }
  },

  obtenerTodasLasVentas: async (token) => {
    try {
      const response = await api.get('/ventas', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener ventas:', error);
      throw error;
    }
  }
};

// Obtener todos los cobros
export const getCobros = async () => {
  try {
    const response = await api.get('/cobros');
    return response.data;
  } catch (error) {
    console.error('Error al obtener los cobros:', error);
    throw error; // Lanza el error para que pueda ser manejado en el componente
  }
};


// Función para obtener todos los colaboradores
export const getColaboradores = async () => {
  try {
    const response = await api.get('/colaboradores');  // Usamos api en lugar de axios
    return response.data;
  } catch (error) {
    console.error('Error al obtener los colaboradores:', error);
    throw error;
  }
};

// Crear un nuevo colaborador
export const createColaborador = async (colaborador) => {
  try {
    const response = await api.post('/colaboradores', colaborador);  // Usando la instancia api
    return response.data;
  } catch (error) {
    console.error('Error al agregar colaborador:', error);
    throw error;
  }
};


// Función para crear un cobro
export const createCobro = async (cobro) => {
  try {
    // Format the data before sending
    const formattedCobro = {
      ...cobro,
      montoPagado: Number(cobro.montoPagado),
      estadoPago: cobro.estadoPago.toLowerCase() // ensure consistent casing
    };
    
    console.log('Datos formateados:', formattedCobro);
    const response = await api.post('/cobros', formattedCobro);
    return response;
  } catch (error) {
    console.error('Error detallado:', error.response?.data);
    throw error;
  }
};

// Función para interactuar con el chatbot
export const sendMessageToChatbot = async (data) => {
  try {
    // Enviar el mensaje al backend, junto con el token en las cabeceras
    const response = await api.post('/chatbot/interact', { message: data.message }, {
      headers: { 'Authorization': `Bearer ${data.token}` },  // Asegúrate de pasar el token aquí
    });
    return response.data.reply;  // Retorna la respuesta del chatbot
  } catch (error) {
    console.error('Error al interactuar con el chatbot:', error);
    throw error;  // Lanza el error para que se pueda manejar en handleSendMessage
  }
};

export const getGastos = async () => {
  try {
    const response = await api.get('/gastos');  // Usando la instancia api
    return response.data;
  } catch (error) {
    console.error('Error al obtener gastos:', error);
    throw error;
  }
};

// Crear un nuevo gasto
export const createGasto = async (gasto) => {
  try {
    const response = await api.post('/gastos', gasto);  // Usando la instancia api
    return response.data;
  } catch (error) {
    console.error('Error al agregar gasto:', error);
    throw error;
  }
};

// Actualizar un gasto existente
export const updateGasto = async (id, gasto) => {
  try {
    const response = await api.put(`/gastos/${id}`, gasto);  // Usando la instancia api
    return response.data;
  } catch (error) {
    console.error('Error al actualizar gasto:', error);
    throw error;
  }
};

export const deleteGasto = async (id) => {
  try {
    const response = await api.delete(`/gastos/${id}`);  // Usando la instancia api
    return response.data;
  } catch (error) {
    console.error('Error al eliminar gasto:', error);
    throw error;
  }
};

export const getGestionPersonal = async () => {
  try {
    const response = await api.get('/gestion-personal');  // Usando la instancia api
    return response.data;
  } catch (error) {
    console.error('Error al obtener gestión personal:', error);
    throw error;
  }
};

export const createGestionPersonal = async (gestion) => {
  try {
    const response = await api.post('/gestion-personal', gestion);  // Usando la instancia api
    return response.data;
  } catch (error) {
    console.error('Error al agregar gestión personal:', error);
    throw error;
  }
};

export const updateGestionPersonal = async (id, gestion) => {
  try {
    const response = await api.put(`/gestion-personal/${id}`, gestion);  // Usando la instancia api
    return response.data;
  } catch (error) {
    console.error('Error al actualizar gestión personal:', error);
    throw error;
  }
};

export const deleteGestionPersonal = async (id) => {
  try {
    if (!id) {
      throw new Error('ID es requerido para eliminar el registro');
    }
    
    const response = await api.delete(`/gestion-personal/${id}`);
    if (!response.data) {
      throw new Error('No se recibió confirmación del servidor');
    }
    return response.data;
  } catch (error) {
    console.error('Error al eliminar gestión personal:', error);
    throw error.response?.data || error;
  }
};


export default api;