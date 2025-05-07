import axios from 'axios';

const API_URL = 'http://localhost:5000/api';  
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

// Obtener todas las ventas
export const getVentas = async () => {
  try {
    const response = await api.get('/ventas');  // Usando la instancia api
    return response.data;
  } catch (error) {
    console.error('Error al obtener ventas:', error);
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

// Obtener todos los cobros
export const getCobros = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/cobros');
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
    const response = await axios.post('http://localhost:5000/api/cobros', formattedCobro);
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