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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const GastosOverTimeChart = ({ gastos, selectedRange }) => {
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
      fechaValida = new Date();
    }

    return fechaValida;
  };

  // Filtrar los gastos según el rango seleccionado
  const filteredData = useMemo(() => {
    if (!gastos || gastos.length === 0) return [];

    const gastosConFechasValidas = gastos.map(gasto => {
      let fechaValida = parseDate(gasto.fechaGasto);
      return {
        ...gasto,
        fechaGasto: fechaValida
      };
    });

    const now = new Date();
    let resultado = [];

    switch (selectedRange) {
      case 'day': {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        resultado = gastosConFechasValidas.filter(gasto =>
          gasto.fechaGasto >= today && gasto.fechaGasto < tomorrow
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

        resultado = gastosConFechasValidas.filter(gasto =>
          gasto.fechaGasto >= startOfWeek && gasto.fechaGasto < endOfWeek
        );
        break;
      }
      case 'month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        resultado = gastosConFechasValidas.filter(gasto =>
          gasto.fechaGasto >= startOfMonth && gasto.fechaGasto <= endOfMonth
        );
        break;
      }
      case 'year': {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
        resultado = gastosConFechasValidas.filter(gasto =>
          gasto.fechaGasto >= startOfYear && gasto.fechaGasto < endOfYear
        );
        break;
      }
      default:
        resultado = gastosConFechasValidas;
    }

    return resultado;
  }, [gastos, selectedRange]);

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

  const getGroupingFormat = (date, range) => {
    switch (range) {
      case 'day':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
      case 'week':
      case 'month':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      case 'year':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      default:
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
  };

  const generateTimeIntervals = (range) => {
    const now = new Date();
    const intervals = [];

    switch (range) {
      case 'day': {
        for (let i = 0; i < 24; i++) {
          const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), i);
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
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
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
      default: {
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(now.getMonth() - i);
          intervals.push({
            key: getGroupingFormat(date, range),
            label: formatDate(date, range)
          });
        }
      }
    }

    return intervals;
  };

    const groupedData = useMemo(() => {
    if (!gastos || gastos.length === 0) {
      return {
        labels: [],
        produccion: [],
        finanzas: [],
        ventas: [],
        administrativo: []
      };
    }
  const timeIntervals = generateTimeIntervals(selectedRange);
    const groupedGastos = {
      Producción: {},
      Financiero: {},
      Ventas: {},
      Administración: {}
    };

    // Inicializar acumuladores
    Object.keys(groupedGastos).forEach(categoria => {
      timeIntervals.forEach(interval => {
        groupedGastos[categoria][interval.key] = 0;
      });
    });

    // Agrupar gastos por categoría
    filteredData.forEach((gasto) => {
      const montoTotal = parseFloat(gasto.montoTotal) || 0;
      const date = new Date(gasto.fechaGasto);
      const key = getGroupingFormat(date, selectedRange);

      if (key in groupedGastos[gasto.gasto]) {
        groupedGastos[gasto.gasto][key] += montoTotal;
      }
    });



    return {
      labels: timeIntervals.map(interval => interval.label),
      produccion: timeIntervals.map(interval => groupedGastos['Producción'][interval.key] || 0),
      finanzas: timeIntervals.map(interval => groupedGastos['Financiero'][interval.key] || 0),
      ventas: timeIntervals.map(interval => groupedGastos['Ventas'][interval.key] || 0),
      administrativo: timeIntervals.map(interval => groupedGastos['Administración'][interval.key] || 0)
    };
  }, [filteredData, selectedRange]);

  const chartData = {
    labels: groupedData.labels,
    datasets: [
      {
        label: 'Producción (S/)',
        data: groupedData.produccion,
        borderColor: 'rgba(46, 204, 113, 1)', // Verde
        backgroundColor: 'rgba(46, 204, 113, 0.1)',
        fill: true,
        pointRadius: 4,
        tension: 0.1,
        borderWidth: 2
      },
      {
        label: 'Finanzas (S/)',
        data: groupedData.finanzas,
        borderColor: 'rgba(52, 152, 219, 1)', // Azul
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        fill: true,
        pointRadius: 4,
        tension: 0.1,
        borderWidth: 2
      },
      {
        label: 'Ventas (S/)',
        data: groupedData.ventas,
        borderColor: 'rgba(241, 196, 15, 1)', // Amarillo
        backgroundColor: 'rgba(241, 196, 15, 0.1)',
        fill: true,
        pointRadius: 4,
        tension: 0.1,
        borderWidth: 2
      },
      {
        label: 'Administrativo (S/)',
        data: groupedData.administrativo,
        borderColor: 'rgba(155, 89, 182, 1)', // Morado
        backgroundColor: 'rgba(155, 89, 182, 0.1)',
        fill: true,
        pointRadius: 4,
        tension: 0.1,
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { 
        position: 'top', 
        labels: { 
          usePointStyle: true, 
          padding: 15,
          font: { size: 12 }
        } 
      },
      title: {
        display: true,
        text: `Gastos por Sección - ${getTimeRangeTitle(selectedRange)}`,
        font: { size: 16 },
        padding: { top: 10, bottom: 20 }
      },
      tooltip: {
        callbacks: {
          label: context => `${context.dataset.label}: S/ ${context.raw.toFixed(2)}`
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
        grid: { display: true }
      },
      y: {
        title: { 
          display: true, 
          text: 'Monto (S/)', 
          font: { weight: 'bold' } 
        },
        beginAtZero: true,
        grid: { display: true },
        ticks: { 
          callback: value => `S/ ${value}`
        }
      }
    }
  };

  function getTimeRangeTitle(range) {
    switch(range) {
      case 'day': return 'Hoy';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mes';
      case 'year': return 'Este Año';
      default: return 'Histórico';
    }
  }

  function getXAxisLabel(range) {
    switch(range) {
      case 'day': return 'Hora del Día';
      case 'week': return 'Día de la Semana';
      case 'month': return 'Día del Mes';
      case 'year': return 'Mes';
      default: return 'Período';
    }
  }

  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-lg text-gray-500">No hay datos de gastos para mostrar en el período seleccionado</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md" style={{ height: '400px' }}>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default GastosOverTimeChart;