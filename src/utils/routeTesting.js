// Script de testing para validar rutas
const testRoutes = [
  '/',
  '/dashboard',
  '/dashboard/productos',
  '/dashboard/ventas',
  '/dashboard/cobros',
  '/dashboard/colaboradores',
  '/dashboard/gestion-personal',
  '/dashboard/reportes',
  '/dashboard/gastos',
  '/dashboard/productos?search=test&page=2',
  '/dashboard/nonexistent' // Debe redirigir
];

// Función para probar rutas en desarrollo
export const testRoutesInDev = () => {
  console.log('🧪 Iniciando pruebas de rutas...');
  
  testRoutes.forEach((route, index) => {
    setTimeout(() => {
      console.log(`📍 Probando ruta: ${route}`);
      window.history.pushState({}, '', route);
      
      // Simular recarga de página
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }, index * 2000);
  });
};

// Checklist de validación para producción
export const productionChecklist = {
  routes: [
    '✅ Ruta raíz (/) redirige correctamente',
    '✅ Rutas de dashboard funcionan',
    '✅ Recarga de página mantiene la ruta',
    '✅ URLs con parámetros se mantienen',
    '✅ Rutas inexistentes redirigen',
    '✅ Navegación del navegador (atrás/adelante)'
  ],
  performance: [
    '✅ Lazy loading funciona',
    '✅ Componentes se cargan bajo demanda',
    '✅ Error boundaries capturan errores',
    '✅ Loading states son visibles'
  ],
  seo: [
    '✅ URLs son descriptivas',
    '✅ Cada sección tiene su URL única',
    '✅ Meta tags dinámicos (opcional)',
    '✅ Sitemap.xml actualizado (opcional)'
  ]
};

// Utilidad para debugging de rutas
export const debugRoute = () => {
  console.log('🔍 Debug de ruta actual:');
  console.log('Location:', window.location);
  console.log('Pathname:', window.location.pathname);
  console.log('Search:', window.location.search);
  console.log('Hash:', window.location.hash);
};
