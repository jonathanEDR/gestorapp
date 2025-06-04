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
  Legend,
);

const CollectionsOverTimeChart = ({ cobros, selectedRange }) => {
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
  }

  const filteredData = useMemo(() => {
    if (!cobros || cobros.length === 0) return [];


  const cobrosConFechasValidas = cobros.map(cobro => ({
    ...cobro,
    fechaCobro: parseDate(cobro.fechaPago),
    yape: parseFloat(cobro.yape || 0),
    efectivo: parseFloat(cobro.efectivo || 0),
    gastosImprevistos: parseFloat(cobro.gastosImprevistos || 0)
  }));

    const now = new Date();
    let resultado = [];

    switch (selectedRange) {
      case 'day': {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        resultado = cobrosConFechasValidas.filter(cobro =>
          cobro.fechaCobro >= today && cobro.fechaCobro < tomorrow
        );
        break;
      }
case 'week': {
  // Obtener el lunes de la semana actual
  const currentDate = new Date(now);
  const currentDay = currentDate.getDay() || 7; // Convertir 0 (domingo) a 7
  const diff = currentDay - 1; // Diferencia hasta el lunes
  
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  endOfWeek.setHours(0, 0, 0, 0);

  resultado = cobrosConFechasValidas.filter(cobro =>
    cobro.fechaCobro >= startOfWeek && cobro.fechaCobro < endOfWeek
  );
  break;
}

case 'month': {
  // Usar el primer y último día del mes actual
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  resultado = cobrosConFechasValidas.filter(cobro =>
    cobro.fechaCobro >= startOfMonth && cobro.fechaCobro <= endOfMonth
  );
  break;
}
      case 'year': {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
        resultado = cobrosConFechasValidas.filter(cobro =>
          cobro.fechaCobro >= startOfYear && cobro.fechaCobro < endOfYear
        );
        break;
      }
      case 'historical':
      default:
        resultado = cobrosConFechasValidas;
        break;
    }

    return resultado;
  }, [cobros, selectedRange]);

  const formatDate = (date, range) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    
    switch (range) {
      case 'day':
        return `${String(date.getHours()).padStart(2, '0')}:00`;
    case 'week':
      return date.toLocaleDateString('es-ES', { 
        weekday: 'short',
        day: 'numeric'
      });
    case 'month':
      return date.getDate().toString(); // Solo mostrar el día del mes
      case 'year':
        return `${new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(date)}`;
      default:
        return date.toLocaleDateString('es-ES');
    }
  };

  const getGroupingFormat = (date, range) => {
    switch (range) {
      case 'day':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00:00`;
      case 'week':
      case 'month':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      case 'year':
      default:
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
  };

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
      // Obtener el lunes de la semana actual
      const currentDate = new Date(now);
      const currentDay = currentDate.getDay() || 7;
      const diff = currentDay - 1;
      
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - diff);
      startOfWeek.setHours(0, 0, 0, 0);

      // Generar los 7 días comenzando desde el lunes
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
      // Usar el número real de días en el mes
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

  // Modificar la función groupedData para incluir los valores separados
const groupedData = useMemo(() => {
  if (filteredData.length === 0) {
    return {
      labels: [],
      values: [],
      yapeValues: [],
      efectivoValues: [],
      gastosValues: []
    };
  }

  const groupedCollections = {};
  const groupedYape = {};
  const groupedEfectivo = {};
  const groupedGastos = {};
  
  // Inicializar todas las fechas con 0
  const timeIntervals = generateTimeIntervals(selectedRange);
  timeIntervals.forEach(interval => {
    groupedCollections[interval.key] = 0;
    groupedYape[interval.key] = 0;
    groupedEfectivo[interval.key] = 0;
    groupedGastos[interval.key] = 0;
  });

  // Agrupar los datos
  filteredData.forEach((cobro) => {
    const date = new Date(cobro.fechaCobro);
    const key = getGroupingFormat(date, selectedRange);
    
    if (key in groupedCollections) {
      groupedYape[key] += cobro.yape;
      groupedEfectivo[key] += cobro.efectivo;
      groupedGastos[key] += cobro.gastosImprevistos;
      // El total es la suma de todos los tipos de cobro
      groupedCollections[key] = groupedYape[key] + groupedEfectivo[key] + groupedGastos[key];
    }
  });

  return {
    labels: timeIntervals.map(interval => interval.label),
    values: timeIntervals.map(interval => groupedCollections[interval.key] || 0),
    yapeValues: timeIntervals.map(interval => groupedYape[interval.key] || 0),
    efectivoValues: timeIntervals.map(interval => groupedEfectivo[interval.key] || 0),
    gastosValues: timeIntervals.map(interval => groupedGastos[interval.key] || 0)
  };
}, [filteredData, selectedRange]);

  const calculateTotals = useMemo(() => {
    if (!filteredData.length) {
      return {
        totalCobros: 0,
        totalYape: 0,
        totalEfectivo: 0,
        totalGastos: 0
      };
    }

    return filteredData.reduce((acc, cobro) => {
      const yape = parseFloat(cobro.yape || 0);
      const efectivo = parseFloat(cobro.efectivo || 0);
      const gastos = parseFloat(cobro.gastosImprevistos || 0);

      return {
        totalCobros: acc.totalCobros + yape + efectivo,
        totalYape: acc.totalYape + yape,
        totalEfectivo: acc.totalEfectivo + efectivo,
        totalGastos: acc.totalGastos + gastos
      };
    }, {
      totalCobros: 0,
      totalYape: 0,
      totalEfectivo: 0,
      totalGastos: 0
    });
  }, [filteredData]);




const chartData = {
  labels: groupedData.labels,
  datasets: [
    {
      label: 'Total Cobros (S/)',
      data: groupedData.values,
      borderColor: 'rgba(54, 162, 235, 1)',
      backgroundColor: 'rgba(54, 162, 235, 0.1)',
      fill: false,
      pointRadius: 4,
      tension: 0.1,
      order: 4, // Mover al fondo para que se vea mejor
      borderWidth: 2
    },
    {
      label: 'Yape (S/)',
      data: groupedData.yapeValues,
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.1)',
      fill: true,
      pointRadius: 3,
      tension: 0.1,
      order: 1,
      borderWidth: 2
    },
    {
      label: 'Efectivo (S/)',
      data: groupedData.efectivoValues,
      borderColor: 'rgba(255, 159, 64, 1)',
      backgroundColor: 'rgba(255, 159, 64, 0.1)',
      fill: true,
      pointRadius: 3,
      tension: 0.1,
      order: 2,
      borderWidth: 2
    },
    {
      label: 'Gastos Imprevistos (S/)',
      data: groupedData.gastosValues,
      borderColor: 'rgba(255, 99, 132, 1)',
      backgroundColor: 'rgba(255, 99, 132, 0.1)',
      fill: true,
      pointRadius: 3,
      tension: 0.1,
      order: 3,
      borderWidth: 2
    }
  ]
};


  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 20,
        right: 25,
        bottom: 20,
        left: 25
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'start',
        labels: {
          usePointStyle: true,
          padding: 15,
          boxWidth: 10,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: `Control de Cobros - ${getTimeRangeTitle(selectedRange)}`,
        font: { size: 16, weight: 'bold' },
        padding: { bottom: 20 }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        padding: 10,
        callbacks: {
          label: (context) => `${context.dataset.label}: S/ ${context.raw.toFixed(2)}`
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: true,
          drawBorder: true,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 11
          },
          padding: 5
        }
      },
      y: {
        position: 'left',
        grid: {
          display: true,
          drawBorder: true,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: (value) => `S/ ${value}`,
          font: {
            size: 11
          },
          padding: 5,
          stepSize: Math.ceil(Math.max(...groupedData.values) / 10)
        },
        beginAtZero: true
      }
    }
  };

  function getTimeRangeTitle(range) {
    switch(range) {
      case 'day': return 'Hoy';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mes';
      case 'year': return 'Este Año';
      case 'historical': return 'Histórico';
      default: return 'Todos los Cobros';
    }
  }

  function getXAxisLabel(range) {
    switch(range) {
      case 'day': return 'Hora del Día';
      case 'week': return 'Día de la Semana';
      case 'month': return 'Día del Mes';
      case 'year': return 'Mes';
      default: return 'Tiempo';
    }
  }

  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-lg text-gray-500">No hay datos de cobros para mostrar en el período seleccionado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Container del gráfico con altura ajustable */}
      <div className="p-4">
        <div style={{ height: '450px', width: '100%' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

           {/* Resumen en cards con los nuevos totales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border-t border-gray-200">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-blue-700 font-semibold text-sm">
            Total Cobros - {getTimeRangeTitle(selectedRange)}
          </h4>
          <p className="text-xl font-bold">
            S/ {calculateTotals.totalCobros.toFixed(2)}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {selectedRange === 'day' ? 'Hoy' : 
             selectedRange === 'week' ? 'Esta semana' :
             selectedRange === 'month' ? 'Este mes' :
             selectedRange === 'year' ? 'Este año' : 'Total histórico'}
          </p>
        </div>
        
        <div className="bg-cyan-50 p-4 rounded-lg">
          <h4 className="text-cyan-700 font-semibold text-sm">
            Total Yape - {getTimeRangeTitle(selectedRange)}
          </h4>
          <p className="text-xl font-bold">
            S/ {calculateTotals.totalYape.toFixed(2)}
          </p>
          <p className="text-xs text-cyan-600 mt-1">
            {((calculateTotals.totalYape / calculateTotals.totalCobros) * 100).toFixed(1)}% del total
          </p>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <h4 className="text-orange-700 font-semibold text-sm">
            Total Efectivo - {getTimeRangeTitle(selectedRange)}
          </h4>
          <p className="text-xl font-bold">
            S/ {calculateTotals.totalEfectivo.toFixed(2)}
          </p>
          <p className="text-xs text-orange-600 mt-1">
            {((calculateTotals.totalEfectivo / calculateTotals.totalCobros) * 100).toFixed(1)}% del total
          </p>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <h4 className="text-red-700 font-semibold text-sm">
            Total Gastos - {getTimeRangeTitle(selectedRange)}
          </h4>
          <p className="text-xl font-bold">
            S/ {calculateTotals.totalGastos.toFixed(2)}
          </p>
          <p className="text-xs text-red-600 mt-1">
            {((calculateTotals.totalGastos / calculateTotals.totalCobros) * 100).toFixed(1)}% del total
          </p>
        </div>
      </div>
    </div>
  );
};
export default CollectionsOverTimeChart;