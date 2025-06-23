// Configuración de optimización para producción
export const config = {
  // Configuración de la API según el entorno
  apiUrl: process.env.NODE_ENV === 'production' 
    ? process.env.REACT_APP_API_URL 
    : 'http://localhost:5000/api',
    
  // Configuración de Clerk
  clerkPublishableKey: process.env.REACT_APP_CLERK_PUBLISHABLE_KEY,
  
  // Configuración de cache
  cacheTimeout: 5 * 60 * 1000, // 5 minutos
  
  // Configuración de paginación
  defaultPageSize: 24,
  
  // Configuración de retry
  maxRetries: 3,
  retryDelay: 1000,
};

// Función para detectar si estamos en producción
export const isProduction = () => {
  return process.env.NODE_ENV === 'production';
};

// Función para logging condicional
export const logger = {
  info: (message, data) => {
    if (!isProduction()) {
      console.log(`ℹ️ ${message}`, data);
    }
  },
  warn: (message, data) => {
    if (!isProduction()) {
      console.warn(`⚠️ ${message}`, data);
    }
  },
  error: (message, error) => {
    console.error(`❌ ${message}`, error);
    // En producción, podrías enviar a un servicio de monitoreo
    if (isProduction()) {
      // Sentry, LogRocket, etc.
    }
  }
};

// Función para manejar errores de red
export const handleNetworkError = (error, retryCallback) => {
  logger.error('Error de red detectado', error);
  
  if (error.code === 'NETWORK_ERROR' && retryCallback) {
    setTimeout(() => {
      logger.info('Reintentando conexión...');
      retryCallback();
    }, config.retryDelay);
  }
};
