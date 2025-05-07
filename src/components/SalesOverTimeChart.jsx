import React, { useMemo } from 'react';
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
import zoomPlugin from 'chartjs-plugin-zoom';

// Registrar los componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

const SalesOverTimeChart = ({ ventas, selectedRange }) => {

    const parseDate = (fecha) => {
      let fechaValida;
      
      if (typeof fecha === 'string') {
        fechaValida = new Date(fecha);
        // Intentar otro formato si el ISO no es válido
        if (isNaN(fechaValida.getTime()) && fecha.includes('/')) {
          const parts = fecha.split('/');
          if (parts.length === 3) {
            fechaValida = new Date(parts[2], parts[1] - 1, parts[0]); // DD/MM/YYYY
          }
        }
      } else if (fecha instanceof Date) {
        fechaValida = fecha;
      } else {
        fechaValida = new Date(); // Usar fecha actual como fallback
      }
      
      return fechaValida;
    }
  
    // Filtrar las ventas según el rango seleccionado
    const filteredData = useMemo(() => {
      if (!ventas || ventas.length === 0) return [];
  
      const ventasConFechasValidas = ventas.map(venta => {
        let fechaValida = parseDate(venta.fechadeVenta);
        return {
          ...venta,
          fechaVenta: fechaValida,
          fechaOriginal: venta.fechadeVenta
        };
      });
  
      const now = new Date();
      let resultado = [];
  
      switch (selectedRange) {
        case 'day': {
          // Filtrar solo las ventas de hoy (00:00 - 23:59)
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Inicio del día de hoy
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1); // Fin del día de hoy (justo antes de la medianoche)
      
          // Filtramos solo las ventas que ocurrieron hoy
          resultado = ventasConFechasValidas.filter(venta =>
            venta.fechaVenta >= today && venta.fechaVenta < tomorrow
          );
          break;
        }
        case 'week': {
          const currentDate = new Date(now);
          const dayOfWeek = currentDate.getDay();
          const startOfWeek = new Date(currentDate);
          startOfWeek.setDate(currentDate.getDate() - dayOfWeek);
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
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          resultado = ventasConFechasValidas.filter(venta =>
            venta.fechaVenta >= startOfMonth && venta.fechaVenta < endOfMonth
          );
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
  
      console.log(`Total de registros después de filtrar (${selectedRange}): ${resultado.length}`);
  
      return resultado;
    }, [ventas, selectedRange]);
  
    // Formato para mostrar fechas en diferentes rangos
    const formatDate = (date, range) => {
      const options = { weekday: 'short', month: 'short', day: 'numeric' };
      
      switch (range) {
        case 'day':
          return `${String(date.getHours()).padStart(2, '0')}:00`;
        case 'week':
          return date.toLocaleDateString('es-ES', options);
        case 'month':
          return `${date.getDate()}/${date.getMonth() + 1}`;
        case 'year':
          return `${new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(date)}`;
        default:
          return date.toLocaleDateString('es-ES');
      }
    };

    // Determinar el formato de agrupación según el rango seleccionado
    const getGroupingFormat = (date, range) => {
      switch (range) {
        case 'day':
          // Agrupar por hora (YYYY-MM-DD HH:00:00)
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00:00`;
        case 'week':
          // Agrupar por día (YYYY-MM-DD)
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        case 'month':
          // Agrupar por día del mes (YYYY-MM-DD)
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        case 'year':
          // Agrupar por mes (YYYY-MM)
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        default:
          // Histórico: agrupar por mes (YYYY-MM)
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
    };

    // Generar todos los intervalos para el rango seleccionado
    const generateTimeIntervals = (range) => {
      const now = new Date();
      const intervals = [];
      
      switch (range) {
        case 'day': {
          // Generar las 24 horas del día
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
          // Generar los 7 días de la semana
          const currentDate = new Date(now);
          const dayOfWeek = currentDate.getDay();
          const startOfWeek = new Date(currentDate);
          startOfWeek.setDate(currentDate.getDate() - dayOfWeek);
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
          // Generar todos los días del mes
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          const daysInMonth = endOfMonth.getDate();
          
          for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(startOfMonth);
            date.setDate(i);
            intervals.push({
              key: getGroupingFormat(date, range),
              label: formatDate(date, range)
            });
          }
          break;
        }
        case 'year': {
          // Generar los 12 meses del año
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
          // Para histórico, podríamos mostrar los últimos 12 meses por ejemplo
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
  
    // Agrupar las ventas según el rango seleccionado
    const groupedData = useMemo(() => {
      if (filteredData.length === 0) {
        return { labels: [], values: [] };
      }
  
      const groupedSales = {};
  
      // Agrupar las ventas según el rango seleccionado
      filteredData.forEach((venta) => {
        const montoTotal = parseFloat(venta.montoTotal) || 0;
        const date = new Date(venta.fechaVenta);
        const key = getGroupingFormat(date, selectedRange);
        
        if (!groupedSales[key]) {
          groupedSales[key] = 0;
        }
        groupedSales[key] += montoTotal;
      });
  
      // Generar todos los intervalos posibles según el rango
      const timeIntervals = generateTimeIntervals(selectedRange);
  
      // Llenar con valor 0 los intervalos sin ventas
      const labels = timeIntervals.map(interval => interval.label);
      const values = timeIntervals.map(interval => groupedSales[interval.key] || 0);
  
      return {
        labels,
        values
      };
    }, [filteredData, selectedRange]);
  
    // Configurar los datos del gráfico
    const chartData = {
      labels: groupedData.labels,
      datasets: [{
        label: getDatasetLabel(selectedRange),
        data: groupedData.values,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        pointRadius: 5,
        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1,
      }]
    };
  
    // Opciones del gráfico
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: `Evolución de Ventas - ${getTimeRangeTitle(selectedRange)}`,
          font: { size: 16 },
          padding: { top: 10, bottom: 20 }
        },
        tooltip: {
          callbacks: {
            label: (context) => `S/ ${context.raw.toFixed(2)}`,
          },
        },
        zoom: {
          pan: { 
            enabled: true, 
            mode: 'xy',
            threshold: 5
          },
          zoom: { 
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: 'xy',
          },
          limits: {
            y: { min: 'original', max: 'original' }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: getXAxisLabel(selectedRange),
            font: { weight: 'bold' }
          },
          ticks: {
            autoSkip: true,
            maxRotation: 45,
            minRotation: 30
          },
          grid: {
            display: true,
            drawBorder: true
          }
        },
        y: {
          title: {
            display: true,
            text: 'Monto Total (S/)',
            font: { weight: 'bold' }
          },
          beginAtZero: true,
          grid: {
            display: true,
            drawBorder: true
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      }
    };
  
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

    function getDatasetLabel(range) {
      switch(range) {
        case 'day': return 'Ventas por Hora (S/)';
        case 'week': return 'Ventas por Día (S/)';
        case 'month': return 'Ventas por Día (S/)';
        case 'year': return 'Ventas por Mes (S/)';
        case 'historical': return 'Ventas por Período (S/)';
        default: return 'Ventas (S/)';
      }
    }
  
    if (filteredData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-lg text-gray-500">No hay datos de ventas para mostrar en el período seleccionado</p>
        </div>
      );
    }
  
    return (
      <div className="bg-white p-4 rounded-lg shadow-md" style={{ height: '400px' }}>
        <Line data={chartData} options={chartOptions} />
      </div>
    );
  };
  
  export default SalesOverTimeChart;