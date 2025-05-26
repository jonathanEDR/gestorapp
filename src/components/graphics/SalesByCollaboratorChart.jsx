import React, { useMemo, useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Registrar los componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

const SalesByCollaboratorChart = ({ ventas, selectedRange }) => {
  // Estados para controlar la visualización (eliminamos 'all')
  const [viewMode, setViewMode] = useState('single'); // Solo 'single' y 'multiple'
  const [selectedCollaborator, setSelectedCollaborator] = useState(''); // Para modo single
  const [selectedCollaborators, setSelectedCollaborators] = useState(new Set()); // Para modo multiple

  const parseDate = (fecha) => {
    let fechaValida;

    if (typeof fecha === 'string') {
      fechaValida = new Date(fecha);
      if (isNaN(fechaValida.getTime()) && fecha.includes('/')) {
        const parts = fecha.split('/');
        if (parts.length === 3) {
          fechaValida = new Date(parts[2], parts[1] - 1, parts[0]); // DD/MM/YYYY
        }
      }
    } else if (fecha instanceof Date) {
      fechaValida = fecha;
    } else {
      fechaValida = new Date(); // fallback
    }

    return fechaValida;
  }

  // Filtrar las ventas según el rango seleccionado
const filteredData = useMemo(() => {
  if (!ventas || ventas.length === 0) return [];

  const ventasConFechasValidas = ventas.map(venta => {
    // Verificar todos los posibles campos de fecha
    const fechaOriginal = venta.fechaVenta || venta.fechadeVenta || venta.fecha || venta.date;
    let fechaValida = parseDate(fechaOriginal);

    // Verificar campos de monto y cantidad
    const montoTotal = parseFloat(venta.montoTotal) || parseFloat(venta.total) || 0;
    const cantidad = parseInt(venta.cantidad) || 0;

    // Verificar campos de producto
    const producto = venta.productoId?.nombre || venta.producto?.nombre || 'Producto sin nombre';

    // Verificar campos de colaborador
    const colaborador = venta.colaborador || venta.vendedor || 'Sin Asignar';

    return {
      ...venta,
      fechaVenta: fechaValida,
      fechaOriginal: fechaOriginal,
      montoTotal: montoTotal,
      cantidad: cantidad,
      producto: producto,
      colaborador: colaborador
    };
  });

    const now = new Date();
    let resultado = [];

    switch (selectedRange) {
      case 'day': {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        resultado = ventasConFechasValidas.filter(venta =>
          venta.fechaVenta >= today && venta.fechaVenta < tomorrow
        );
        break;
      }
      case 'week': {
        const currentDate = new Date(now);
        const currentDay = currentDate.getDay() || 7;
        const diff = currentDay - 1;
        
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        endOfWeek.setHours(0, 0, 0, 0);

        resultado = ventasConFechasValidas.filter(venta =>
          venta.fechaVenta >= startOfWeek && venta.fechaVenta < endOfWeek
        );
        break;
      }
      case 'month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        resultado = ventasConFechasValidas.filter(venta =>
          venta.fechaVenta >= startOfMonth && venta.fechaVenta <= endOfMonth
        );
              console.log('Ventas filtradas del mes:', resultado); // Debug

        break;
      }
      case 'year': {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
        resultado = ventasConFechasValidas.filter(venta =>
          venta.fechaVenta >= startOfYear && venta.fechaVenta < endOfYear
        );
        break;
      }
      case 'historical':
      default:
        resultado = ventasConFechasValidas;
        break;
    }

    return resultado;
  }, [ventas, selectedRange]);


useEffect(() => {
  console.log('Datos filtrados:', filteredData);
  console.log('Ventas originales:', ventas);
}, [filteredData, ventas]);

  // Obtener lista única de colaboradores
  const colaboradores = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    
    const colaboradoresUnicos = [...new Set(filteredData.map(venta => 
      venta.colaborador || venta.vendedor || venta.usuario || venta.seller || 'Sin Asignar'
    ))];
    
    return colaboradoresUnicos.sort();
  }, [filteredData]);

  // Establecer colaborador por defecto cuando cambian los datos
  React.useEffect(() => {
    if (colaboradores.length > 0 && !selectedCollaborator) {
      // Establecer colaborador por defecto
      const defaultCollaborator = colaboradores.find(col => col !== 'Sin Asignar') || colaboradores[0];
      setSelectedCollaborator(defaultCollaborator);
    }
  }, [colaboradores, selectedCollaborator]);

  // Colores predefinidos para cada colaborador
  const colors = [
    'rgba(75, 192, 192, 1)',   // Verde agua
    'rgba(255, 99, 132, 1)',   // Rojo
    'rgba(54, 162, 235, 1)',   // Azul
    'rgba(255, 206, 86, 1)',   // Amarillo
    'rgba(153, 102, 255, 1)',  // Morado
    'rgba(255, 159, 64, 1)',   // Naranja
    'rgba(199, 199, 199, 1)',  // Gris
    'rgba(83, 102, 255, 1)',   // Azul índigo
    'rgba(255, 99, 255, 1)',   // Magenta
    'rgba(99, 255, 132, 1)'    // Verde lima
  ];

  // Función para manejar el cambio de modo de vista (simplificada)
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode === 'single' && colaboradores.length > 0 && !selectedCollaborator) {
      const defaultCollaborator = colaboradores.find(col => col !== 'Sin Asignar') || colaboradores[0];
      setSelectedCollaborator(defaultCollaborator);
    } else if (mode === 'multiple') {
      setSelectedCollaborators(new Set());
    }
  };

  // Función para manejar la selección de colaborador individual
  const handleSingleCollaboratorChange = (colaborador) => {
    setSelectedCollaborator(colaborador);
  };

  // Función para manejar la selección múltiple de colaboradores
  const handleMultipleCollaboratorSelection = (colaborador) => {
    setSelectedCollaborators(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(colaborador)) {
        newSelection.delete(colaborador);
      } else {
        newSelection.add(colaborador);
      }
      return newSelection;
    });
  };

  // Función para seleccionar todos los colaboradores
  const selectAllCollaborators = () => {
    setSelectedCollaborators(new Set(colaboradores));
  };

  // Función para deseleccionar todos los colaboradores
  const deselectAllCollaborators = () => {
    setSelectedCollaborators(new Set());
  };

  // Función para formatear etiquetas en el eje X
  const formatDate = (date, range) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };

    switch (range) {
      case 'day':
        return `${String(date.getHours()).padStart(2, '0')}:00`;
      case 'week':
        return date.toLocaleDateString('es-ES', options);
      case 'month':
        return date.getDate().toString();
      case 'year':
        return new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(date);
      default:
        return date.toLocaleDateString('es-ES');
    }
  };

  // Función para agrupar las fechas
  const getGroupingFormat = (date, range) => {
    switch (range) {
      case 'day': {
        const normalizedDate = new Date(date);
        normalizedDate.setMinutes(0, 0, 0);
        return `${normalizedDate.getFullYear()}-${String(normalizedDate.getMonth() + 1).padStart(2, '0')}-${String(normalizedDate.getDate()).padStart(2, '0')} ${String(normalizedDate.getHours()).padStart(2, '0')}:00:00`;
      }
      case 'week':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      case 'month':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      case 'year':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      default:
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
  };

  // Generar intervalos de tiempo para el eje X
  const generateTimeIntervals = (range) => {
    const now = new Date();
    const intervals = [];

    switch (range) {
      case 'day': {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        for (let i = 0; i < 24; i++) {
          const date = new Date(today);
          date.setHours(i, 0, 0, 0);
          intervals.push({
            key: getGroupingFormat(date, range),
            label: formatDate(date, range)
          });
        }
        break;
      }
      case 'week': {
        const currentDate = new Date(now);
        const currentDay = currentDate.getDay() || 7;
        const diff = currentDay - 1;
        
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - diff);
        startOfWeek.setHours(0, 0, 0, 0);

        for (let i = 0; i < 7; i++) {
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + i);
          intervals.push({
            key: getGroupingFormat(date, range),
            label: formatDate(date, range)
          });
        }
        break;
      }
      case 'month': {
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const daysInMonth = endOfMonth.getDate();

        for (let i = 1; i <= daysInMonth; i++) {
          const date = new Date(now.getFullYear(), now.getMonth(), i);
          intervals.push({
            key: getGroupingFormat(date, range),
            label: formatDate(date, range)
          });
        }
        break;
      }
      case 'year': {
        for (let i = 0; i < 12; i++) {
          const date = new Date(now.getFullYear(), i, 1);
          intervals.push({
            key: getGroupingFormat(date, range),
            label: formatDate(date, range)
          });
        }
        break;
      }
      case 'historical':
      default: {
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(now.getMonth() - i);
          date.setDate(1);
          intervals.push({
            key: getGroupingFormat(date, range),
            label: formatDate(date, range)
          });
        }
        break;
      }
    }

    return intervals;
  };

  // Agrupar datos por colaborador y período de tiempo (simplificado)
const groupedData = useMemo(() => {
  console.log('Generando datos agrupados');
  console.log('Datos filtrados disponibles:', filteredData);

  if (!filteredData || filteredData.length === 0) {
    return {
      labels: [],
      datasets: []
    };
  }

  const timeIntervals = generateTimeIntervals(selectedRange);
  const collaboratorData = {};

  // Determinar colaboradores a mostrar
  let colaboradoresAMostrar = [];
  if (viewMode === 'single') {
    colaboradoresAMostrar = selectedCollaborator ? [selectedCollaborator] : [];
  } else {
    colaboradoresAMostrar = Array.from(selectedCollaborators);
  }

  // Inicializar estructura de datos
  colaboradoresAMostrar.forEach(colaborador => {
    collaboratorData[colaborador] = {};
    timeIntervals.forEach(interval => {
      collaboratorData[colaborador][interval.key] = {
        montoTotal: 0,
        cantidadTotal: 0,
        ventas: []
      };
    });
  });

  // Agrupar las ventas
  filteredData.forEach(venta => {
    const colaborador = venta.colaborador || venta.vendedor || 'Sin Asignar';
    if (colaboradoresAMostrar.includes(colaborador)) {
      const fechaVenta = new Date(venta.fechaVenta);
      const key = getGroupingFormat(fechaVenta, selectedRange);
      
      if (collaboratorData[colaborador]?.[key]) {
        const monto = parseFloat(venta.montoTotal) || 0;
        const cantidad = parseInt(venta.cantidad) || 0;
        
        collaboratorData[colaborador][key].montoTotal += monto;
        collaboratorData[colaborador][key].cantidadTotal += cantidad;
        collaboratorData[colaborador][key].ventas.push({
          ...venta,
          montoTotal: monto,
          cantidad: cantidad
        });
      }
    }
  });

  // Crear datasets
  const datasets = colaboradoresAMostrar.map((colaborador, index) => {
    const colorIndex = index % colors.length;
    const baseColor = colors[colorIndex];
    const backgroundColor = baseColor.replace('1)', '0.1)');

    const dataPoints = timeIntervals.map(interval => 
      collaboratorData[colaborador][interval.key]?.montoTotal || 0
    );

    return {
      label: colaborador,
      data: dataPoints,
      borderColor: baseColor,
      backgroundColor,
      fill: false,
      pointRadius: 4,
      tension: 0.1,
      borderWidth: 2,
      pointBackgroundColor: baseColor,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      ventasData: collaboratorData[colaborador] // Guardamos los datos completos para el tooltip
    };
  });

  return {
    labels: timeIntervals.map(interval => interval.label),
    datasets
  };
}, [filteredData, selectedRange, viewMode, selectedCollaborator, selectedCollaborators, colors]);

  // Opciones del gráfico
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { 
    mode: 'index', 
    intersect: false 
  },
  plugins: {
    legend: { 
      position: 'top', 
      labels: { 
        usePointStyle: true, 
        padding: 15,
        boxWidth: 12,
        font: { weight: 'bold' }
      } 
    },
    title: {
      display: true,
      text: `Ventas por Colaborador - ${getTimeRangeTitle(selectedRange)}`,
      font: { size: 16, weight: 'bold' },
      padding: { top: 10, bottom: 20 },
      color: '#1f2937'
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      titleColor: '#1f2937',
      bodyColor: '#4b5563',
      borderColor: '#e5e7eb',
      borderWidth: 2,
      padding: 16,
      displayColors: true,
      titleFont: { size: 14, weight: 'bold' },
      bodyFont: { size: 13 },
callbacks: {
  label: (context) => {
    const dataset = context.dataset;
    const currentValue = context.raw;
    const colaborador = dataset.label;
    
    // Obtener la clave correcta para acceder a los datos
    const timeIntervals = generateTimeIntervals(selectedRange);
    const intervalKey = timeIntervals[context.dataIndex]?.key;
    const ventasDelPeriodo = dataset.ventasData?.[intervalKey]?.ventas || [];
    
    // 🎯 MODO COMPARACIÓN: Información resumida y concisa
    if (viewMode === 'multiple') {
      const lines = [
        `👤 ${colaborador}`,
        `💰 Total: S/ ${currentValue.toLocaleString('es-PE', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })}`
      ];
      
      // Solo agregar información básica si hay ventas
      if (ventasDelPeriodo.length > 0) {
        const totalTransacciones = ventasDelPeriodo.length;
        const totalUnidades = ventasDelPeriodo.reduce((sum, venta) => 
          sum + (parseInt(venta.cantidad) || 0), 0
        );
        
        lines.push(
          `📊 ${totalUnidades} unidades`,
          `🛒 ${totalTransacciones} transacciones`
        );
      } else {
        lines.push('❌ Sin ventas');
      }
      
      return lines;
    }
    
    // 🔍 MODO INDIVIDUAL: Información detallada completa
    else {
      const lines = [
        `👤 ${colaborador}`,
        `💰 Total Vendido: S/ ${currentValue.toLocaleString('es-PE', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })}`,
        '',
        '📦 Detalles de Productos:'
      ];

      if (ventasDelPeriodo.length > 0) {
        // Agrupar productos vendidos
        const productosVendidos = ventasDelPeriodo.reduce((acc, venta) => {
          const producto = venta.producto || venta.productoId?.nombre || 'Producto sin nombre';
          if (!acc[producto]) {
            acc[producto] = { cantidad: 0, monto: 0 };
          }
          acc[producto].cantidad += parseInt(venta.cantidad) || 0;
          acc[producto].monto += parseFloat(venta.montoTotal) || 0;
          return acc;
        }, {});

        Object.entries(productosVendidos).forEach(([producto, datos]) => {
          lines.push(
            `• ${producto}:`,
            `  📊 Cantidad: ${datos.cantidad} unid.`,
            `  💵 Monto: S/ ${datos.monto.toFixed(2)}`
          );
        });
        
        lines.push('', `📈 Total de transacciones: ${ventasDelPeriodo.length}`);
      } else {
        lines.push('❌ No hay ventas registradas en este período');
      }

      return lines;
    }
  },
  
  // 🎨 Personalizar el título del tooltip según el modo
  title: (context) => {
    const label = context[0].label;
    
    if (viewMode === 'multiple') {
      return `📊 Comparación - ${label}`;
    } else {
      return `📈 Análisis Detallado - ${label}`;
    }
  },
  
  // 🏷️ Personalizar el footer para el modo comparación
  footer: (tooltipItems) => {
    if (viewMode === 'multiple' && tooltipItems.length > 1) {
      const totalGeneral = tooltipItems.reduce((sum, item) => sum + item.raw, 0);
      return [
        '─────────────────',
        `💎 Total General: S/ ${totalGeneral.toLocaleString('es-PE', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })}`
      ];
    }
    return [];
  }
}
    }
  },
  scales: {
    x: {
      title: { 
        display: true, 
        text: getXAxisLabel(selectedRange), 
        font: { weight: 'bold', size: 14 },
        color: '#1f2937'
      },
      ticks: { 
        autoSkip: true, 
        maxRotation: 45, 
        minRotation: 30,
        font: { size: 12 },
        color: '#4b5563'
      },
      grid: { 
        display: true, 
        drawBorder: true,
        color: '#e5e7eb'
      }
    },
    y: {
      title: { 
        display: true, 
        text: 'Monto Total Vendido (S/)', 
        font: { weight: 'bold', size: 14 },
        color: '#1f2937'
      },
      beginAtZero: true,
      grid: { 
        display: true, 
        drawBorder: true,
        color: '#e5e7eb'
      },
      ticks: { 
        callback: value => `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        font: { weight: '500', size: 12 },
        color: '#4b5563'
      }
    }
  }
};
  // Funciones auxiliares para títulos y etiquetas
  function getTimeRangeTitle(range) {
    switch(range) {
      case 'day': return 'Hoy';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mes';
      case 'year': return 'Este Año';
      case 'historical': return 'Histórico';
      default: return 'Todas las Ventas';
    }
  }

  function getXAxisLabel(range) {
    switch(range) {
      case 'day': return 'Hora del Día';
      case 'week': return 'Día de la Semana';
      case 'month': return 'Día del Mes';
      case 'year': return 'Mes';
      case 'historical': return 'Período';
      default: return 'Tiempo';
    }
  }

  // Renderizado simplificado
  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-lg text-gray-500">No hay datos de ventas para mostrar en el período seleccionado</p>
      </div>
    );
  }

  if (colaboradores.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-lg text-gray-500">No se encontraron colaboradores en los datos de ventas</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      {/* Controles de selección simplificados */}
      <div className="mb-4 space-y-4">
        {/* Selector de modo de vista - Solo 2 opciones */}
        <div className="flex gap-4 items-center flex-wrap">
          <span className="font-medium text-gray-700">Modo de vista:</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewModeChange('single')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'single'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              👤 Colaborador Individual
            </button>
            <button
              onClick={() => handleViewModeChange('multiple')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'multiple'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              👥 Comparar Colaboradores
            </button>
          </div>
        </div>

        {/* Selector individual (dropdown) */}
        {viewMode === 'single' && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-4">
              <span className="font-medium text-gray-700">Colaborador:</span>
              <select
                value={selectedCollaborator}
                onChange={(e) => handleSingleCollaboratorChange(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none transition-colors min-w-48"
              >
                {colaboradores.map((colaborador) => (
                  <option key={colaborador} value={colaborador}>
                    {colaborador}
                  </option>
                ))}
              </select>
              
              {/* Información del colaborador seleccionado */}
              <div className="text-sm text-gray-600 bg-green-50 px-3 py-2 rounded-md">
                👤 Mostrando ventas de: <strong>{selectedCollaborator}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Selector múltiple */}
        {viewMode === 'multiple' && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium text-gray-700">Seleccionar Colaboradores:</span>
              <div className="flex gap-2">
                <button
                  onClick={selectAllCollaborators}
                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                >
                  ✅ Todos
                </button>
                <button
                  onClick={deselectAllCollaborators}
                  className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                >
                  ❌ Ninguno
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {colaboradores.map((colaborador, index) => {
                const isSelected = selectedCollaborators.has(colaborador);
                const colorIndex = index % colors.length;
                
                return (
                  <button
                    key={colaborador}
                    onClick={() => handleMultipleCollaboratorSelection(colaborador)}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 border-2 ${
                      isSelected
                        ? 'text-white shadow-md transform scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
                    }`}
                    style={{
                      backgroundColor: isSelected ? colors[colorIndex] : undefined,
                      borderColor: isSelected ? colors[colorIndex] : undefined
                    }}
                  >
                    {colaborador}
                    {isSelected && (
                      <span className="ml-2 text-xs">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
            
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
              {selectedCollaborators.size === 0 ? (
                <span className="text-orange-600">⚠️ Selecciona colaboradores para comparar sus ventas.</span>
              ) : (
                <span>
                  📊 Comparando {selectedCollaborators.size} colaborador(es): {Array.from(selectedCollaborators).join(', ')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Gráfico */}
      <div style={{ height: '400px' }}>
        {groupedData.datasets.length > 0 ? (
          <Line data={groupedData} options={chartOptions} />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-center">
              <p className="text-lg text-gray-500 mb-2">
                {viewMode === 'single' ? '👤 Selecciona un colaborador' : 
                 '👥 Selecciona colaboradores para comparar'}
              </p>
              <p className="text-sm text-gray-400">
                {viewMode === 'single' ? 'Usa el selector arriba para elegir un colaborador' :
                 'Haz clic en los botones de colaboradores para seleccionarlos'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesByCollaboratorChart;