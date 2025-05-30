import React, { useMemo, useState,useEffect } from 'react';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const CollectionsByCollaboratorChart = ({ cobros, selectedRange: initialRange = 'semana' }) => {
  const [viewMode, setViewMode] = useState('single');
  const [selectedCollaborator, setSelectedCollaborator] = useState('');
  const [selectedCollaborators, setSelectedCollaborators] = useState(new Set());
  const [selectedRange, setSelectedRange] = useState('semana'); 

  // Función auxiliar para generar rango de fechas
const generateDateRange = (startDate, endDate, range) => {
  const dates = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  
  const endDateCopy = new Date(endDate);
  endDateCopy.setHours(23, 59, 59, 999);

  switch (range) {
    case 'week':
    case 'month': {
      while (current <= endDateCopy) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      break;
    }
    case 'year': {
      // Para año, generamos una fecha por mes
      current.setDate(1); // Comenzar desde el primer día del mes
      while (current <= endDateCopy) {
        dates.push(new Date(current));
        current.setMonth(current.getMonth() + 1);
      }
      break;
    }
    case 'historical': {
      // Para histórico, también por mes
      current.setDate(1);
      while (current <= endDateCopy) {
        dates.push(new Date(current));
        current.setMonth(current.getMonth() + 1);
      }
      break;
    }
  }
  return dates;
};

  const parseDate = (fecha) => {
    let fechaValida;
    if (typeof fecha === 'string') {
      fechaValida = new Date(fecha);
      if (isNaN(fechaValida.getTime()) && fecha.includes('/')) {
        const parts = fecha.split('/');
        if (parts.length === 3) {
          fechaValida = new Date(parts[2], parts[1] - 1, parts[0]);
        }
      }
    } else if (fecha instanceof Date) {
      fechaValida = fecha;
    } else {
      fechaValida = new Date();
    }
    return fechaValida;
  };

  // Procesar todos los cobros
  const todosLosCobros = useMemo(() => {
    if (!cobros || cobros.length === 0) return [];

    return cobros.map(cobro => {
      const fechaValida = parseDate(cobro.fechaPago);
      const colaborador = cobro.colaboradorId?.nombre || 'Sin Asignar';
      const montoTotal = (Number(cobro.yape) || 0) + 
                        (Number(cobro.efectivo) || 0) + 
                        (Number(cobro.gastosImprevistos) || 0);

      return {
        ...cobro,
        fechaCobro: fechaValida,
        colaborador: colaborador,
        montoTotal: montoTotal
      };
    });
  }, [cobros]);

  // Obtener colaboradores únicos
  const colaboradores = useMemo(() => {
    if (!todosLosCobros || todosLosCobros.length === 0) return [];
    
    const colaboradoresUnicos = [...new Set(todosLosCobros
      .map(cobro => cobro.colaborador)
      .filter(colaborador => colaborador !== 'Sin Asignar'))];
    
    return colaboradoresUnicos.sort();
  }, [todosLosCobros]);

  // Inicializar rango seleccionado y colaborador por defecto
  useEffect(() => {
    // Establecer rango inicial
    if (initialRange && ['week', 'month', 'year', 'historical'].includes(initialRange)) {
      setSelectedRange(initialRange);
    } else {
      setSelectedRange('month'); // Por defecto mes
    }

    // Establecer colaborador por defecto
    if (colaboradores.length > 0 && !selectedCollaborator) {
      setSelectedCollaborator(colaboradores[0]);
    }
  }, [colaboradores, selectedCollaborator, initialRange]);

  // Colores para el gráfico
  const colors = [
    'rgba(75, 192, 192, 1)',
    'rgba(255, 99, 132, 1)',
    'rgba(54, 162, 235, 1)',
    'rgba(255, 206, 86, 1)',
    'rgba(153, 102, 255, 1)',
    'rgba(255, 159, 64, 1)',
    'rgba(199, 199, 199, 1)',
    'rgba(83, 102, 255, 1)',
    'rgba(255, 99, 255, 1)',
    'rgba(99, 255, 132, 1)'
  ];

  // Funciones de manejo de selección
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode === 'single' && colaboradores.length > 0 && !selectedCollaborator) {
      setSelectedCollaborator(colaboradores[0]);
    } else if (mode === 'multiple') {
      setSelectedCollaborators(new Set());
    }
  };

  const handleSingleCollaboratorChange = (colaborador) => {
    setSelectedCollaborator(colaborador);
  };

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

  const selectAllCollaborators = () => {
    setSelectedCollaborators(new Set(colaboradores));
  };

  const deselectAllCollaborators = () => {
    setSelectedCollaborators(new Set());
  };

  const handleRangeChange = (range) => {
    setSelectedRange(range);
  };

const getDateKey = (date, range) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  switch (range) {
    case 'week':
    case 'month':
      return `${year}-${month}-${day}`;
    case 'year':
    case 'historical':
      // Para año e histórico, solo consideramos año y mes
      return `${year}-${month}`;
    default:
      return `${year}-${month}-${day}`;
  }
};

  const formatDate = (date, range) => {
    const d = new Date(date);
    
    switch (range) {
      case 'week':
        return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
      case 'month':
        return d.getDate();
      case 'year':
        return new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(d);
      case 'historical':
        return new Intl.DateTimeFormat('es-ES', { month: 'short', year: '2-digit' }).format(d);
      default:
        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }
  };

  // Filtrar cobros por rango de fecha y generar fechas faltantes
  const cobrosFiltrados = useMemo(() => {

      // Validación inicial mejorada
  if (!todosLosCobros || todosLosCobros.length === 0) {
    return { 
      dates: generateDateRange(new Date(), new Date(), selectedRange), 
      data: [] 
    };
  }

    const now = new Date();
    let startDate, endDate;

    switch (selectedRange) {
      case 'week': {
        const currentDate = new Date(now);
        const currentDay = currentDate.getDay() || 7;
        const diff = currentDay - 1;
        
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - diff);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        break;
      }
      case 'month': {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      }
      case 'year': {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      }
      case 'historical': {
        if (todosLosCobros.length === 0) {
          startDate = new Date();
          endDate = new Date();
        } else {
          const dates = todosLosCobros.map(c => new Date(c.fechaCobro)).filter(d => !isNaN(d.getTime()));
          if (dates.length === 0) {
            startDate = new Date();
            endDate = new Date();
          } else {
            // Obtener fecha mínima y máxima
            const minDate = new Date(Math.min(...dates));
            const maxDate = new Date(Math.max(...dates));
            
            // Ajustar al primer día del mes para el inicio
            startDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);
            
            // Ajustar al último día del mes para el final
            endDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
            
            // Si las fechas son del mismo mes, extender el rango para mostrar al menos 3 meses
            if (startDate.getTime() === new Date(maxDate.getFullYear(), maxDate.getMonth(), 1).getTime()) {
              // Retroceder 1 mes antes y avanzar 1 mes después
              startDate.setMonth(startDate.getMonth() - 1);
              endDate.setMonth(endDate.getMonth() + 1);
              endDate.setDate(0); // Último día del mes anterior
            }
          }
        }
        break;
      }
      default: {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      }
    }

    const dateRange = generateDateRange(startDate, endDate, selectedRange);
    const filteredData = todosLosCobros.filter(cobro => 
      cobro.fechaCobro >= startDate && cobro.fechaCobro <= endDate
    );

    return { dates: dateRange, data: filteredData };
  }, [todosLosCobros, selectedRange]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        align: 'start',
        labels: { 
          usePointStyle: true, 
          padding: 10, 
          boxWidth: 8,
          font: { size: 12 }
        }
      },

    tooltip: {
      callbacks: {
        label: function(context) {
          return `${context.dataset.label}: S/ ${context.raw.toFixed(2)}`;
        },
        footer: function(tooltipItems) {
          const total = tooltipItems.reduce((sum, item) => sum + item.raw, 0);
          return `Total: S/ ${total.toFixed(2)}`;
        }
      }
    }
  },

    scales: {
      x: {
        grid: { display: false },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: { size: 12 },
          color: '#666',
          callback: (value, index) => formatDate(cobrosFiltrados.dates[index], selectedRange)
        }
      },
      y: {
        
        beginAtZero: true,
        grid: { color: '#f0f0f0' },
        ticks: {
          callback: value => `S/ ${value.toLocaleString('es-ES')}`,
          font: { size: 12 },
          color: '#666'
        }
      }
    }
  };

  function getTimeRangeTitle(range) {
    switch(range) {
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mes';
      case 'year': return 'Este Año';
      case 'historical': return 'Histórico';
      default: return 'Cobros por Período';
    }
  }

  const groupedData = useMemo(() => {
  const { dates, data } = cobrosFiltrados;
  const labels = dates.map(date => formatDate(date, selectedRange));

  if (viewMode === 'single') {
    // Crear datasets con valores en cero
    const datosPorTipo = {
      yape: Array(dates.length).fill(0),
      efectivo: Array(dates.length).fill(0),
      gastosImprevistos: Array(dates.length).fill(0)
    };

    // Si hay datos, actualizar los valores
    if (data.length > 0) {
      dates.forEach((date, index) => {
        const cobrosFecha = data.filter(
          cobro => 
            cobro.colaborador === selectedCollaborator &&
            getDateKey(cobro.fechaCobro, selectedRange) === getDateKey(date, selectedRange)
        );
        
        datosPorTipo.yape[index] = Number(cobrosFecha.reduce((sum, cobro) => sum + (Number(cobro.yape) || 0), 0).toFixed(2));
        datosPorTipo.efectivo[index] = Number(cobrosFecha.reduce((sum, cobro) => sum + (Number(cobro.efectivo) || 0), 0).toFixed(2));
        datosPorTipo.gastosImprevistos[index] = Number(cobrosFecha.reduce((sum, cobro) => sum + (Number(cobro.gastosImprevistos) || 0), 0).toFixed(2));
      });
    }

    return {
      labels,
      datasets: [
        {
          label: `${selectedCollaborator} - Yape`,
          data: datosPorTipo.yape,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true
        },
        {
          label: `${selectedCollaborator} - Efectivo`,
          data: datosPorTipo.efectivo,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true
        },
        {
          label: `${selectedCollaborator} - Gastos Imprevistos`,
          data: datosPorTipo.gastosImprevistos,
          borderColor: 'rgba(255, 206, 86, 1)',
          backgroundColor: 'rgba(255, 206, 86, 0.2)',
          tension: 0.1,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true
        }
      ]
    };
  } else {
      const datasets = Array.from(selectedCollaborators).map((colaborador, index) => {
        const datosPorFecha = dates.map(date => {
          const cobrosFecha = data.filter(
            cobro => 
              cobro.colaborador === colaborador &&
              getDateKey(cobro.fechaCobro, selectedRange) === getDateKey(date, selectedRange)
          );
          return Number(cobrosFecha.reduce((sum, cobro) => sum + cobro.montoTotal, 0).toFixed(2));
        });

        return {
          label: colaborador,
          data: datosPorFecha,
          borderColor: colors[index % colors.length],
          backgroundColor: colors[index % colors.length],
          tension: 0.1,
          pointRadius: 4,
          pointHoverRadius: 6
        };
      });

      return { labels, datasets };
    }
  }, [cobrosFiltrados, selectedRange, viewMode, selectedCollaborator, selectedCollaborators, colors]);

  
  // Renderizado del componente
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="mb-4 space-y-4">
        {/* Selector de rango temporal */}
        <div className="flex gap-4 items-center flex-wrap">
          <span className="font-medium text-gray-700">Período:</span>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleRangeChange('week')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedRange === 'week'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📅 Esta Semana
            </button>
            <button
              onClick={() => handleRangeChange('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedRange === 'month'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📊 Este Mes
            </button>
            <button
              onClick={() => handleRangeChange('year')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedRange === 'year'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📈 Este Año
            </button>
            <button
              onClick={() => handleRangeChange('historical')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedRange === 'historical'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🗂️ Histórico
            </button>
          </div>
        </div>

        {/* Selector de modo de vista */}
        <div className="flex gap-4 items-center flex-wrap border-t pt-4">
          <span className="font-medium text-gray-700">Modo de vista:</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleViewModeChange('single')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'single'
                  ? 'bg-blue-600 text-white'
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

        {viewMode === 'single' && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-4">
              <span className="font-medium text-gray-700">Colaborador:</span>
              <select
                value={selectedCollaborator}
                onChange={(e) => handleSingleCollaboratorChange(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors min-w-48"
              >
                {colaboradores.map((colaborador) => (
                  <option key={colaborador} value={colaborador}>
                    {colaborador}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {viewMode === 'multiple' && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium text-gray-700">Seleccionar Colaboradores:</span>
              <div className="flex gap-2">
                <button
                  onClick={selectAllCollaborators}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
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
              {colaboradores.map((colaborador) => (
                <button
                  key={colaborador}
                  onClick={() => handleMultipleCollaboratorSelection(colaborador)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCollaborators.has(colaborador)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {colaborador}
                </button>
              ))}
            </div>
          </div>
        )}

{/* Gráfico */}
<div className="relative h-[00px] w-full mt-4 p-4">
  <Line 
    data={groupedData} 
    options={chartOptions} 
    className="w-full h-full"
  />
</div>
      </div>
    </div>
  );
};

export default CollectionsByCollaboratorChart;