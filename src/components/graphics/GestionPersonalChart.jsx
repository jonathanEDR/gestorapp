import React, { useMemo, useState } from 'react';
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

// Función para formatear etiquetas en eje X según rango
function formatDate(date, range) {
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
}

// Función para normalizar fechas a formato clave de agrupación
function getGroupingFormat(date, range) {
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
}

// Generar intervalos de tiempo para eje X según rango
function generateTimeIntervals(range) {
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
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
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
}

// Función para título del rango
function getTimeRangeTitle(range) {
  switch (range) {
    case 'day': return 'Hoy';
    case 'week': return 'Esta Semana';
    case 'month': return 'Este Mes';
    case 'year': return 'Este Año';
    case 'historical': return 'Histórico';
    default: return 'Datos';
  }
}

// Etiqueta eje X
function getXAxisLabel(range) {
  switch (range) {
    case 'day': return 'Hora del Día';
    case 'week': return 'Día de la Semana';
    case 'month': return 'Día del Mes';
    case 'year': return 'Mes';
    case 'historical': return 'Período';
    default: return 'Tiempo';
  }
}

const GestionPersonalChart = ({ registros }) => {
  // Estado para seleccionar rango de tiempo
  const [selectedRange, setSelectedRange] = useState('month');

  // Función para filtrar registros según rango
  const filtrarRegistrosPorFecha = (registros) => {
    if (selectedRange === 'month') return registros;

    const hoy = new Date();
    let inicio = new Date();
    let fin = new Date();

    switch (selectedRange) {
      case 'day':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        fin = new Date(inicio);
        fin.setDate(inicio.getDate() + 1);
        break;
      case 'week': {
        const diaSemana = hoy.getDay() || 7;
        const diferenciaDias = diaSemana - 1;
        inicio = new Date(hoy);
        inicio.setDate(hoy.getDate() - diferenciaDias);
        inicio.setHours(0, 0, 0, 0);
        fin = new Date(inicio);
        fin.setDate(inicio.getDate() + 7);
        fin.setHours(0, 0, 0, 0);
        break;
      }
      case 'month':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        fin.setHours(23, 59, 59, 999);
        break;
      case 'year':
        inicio = new Date(hoy.getFullYear(), 0, 1);
        fin = new Date(hoy.getFullYear() + 1, 0, 1);
        break;
      default:
        return registros;
    }

    return registros.filter(registro => {
      const fechaRegistro = new Date(registro.fechaDeGestion);
      return fechaRegistro >= inicio && fechaRegistro < fin;
    });
  };

  // Agrupar datos por rango y sumarizar métricas
  const groupedData = useMemo(() => {
    const registrosFiltrados = filtrarRegistrosPorFecha(registros || []);
    if (registrosFiltrados.length === 0) return {
      labels: [],
      pagosValues: [],
      faltantesValues: [],
      adelantosValues: [],
      gastosValues: []
    };

    const timeIntervals = generateTimeIntervals(selectedRange);

    // Inicializar acumuladores
    const pagos = {};
    const faltantes = {};
    const adelantos = {};
    const gastos = {};
    timeIntervals.forEach(i => {
      pagos[i.key] = 0;
      faltantes[i.key] = 0;
      adelantos[i.key] = 0;
      gastos[i.key] = 0;
    });

    // Agrupar y sumarizar
registrosFiltrados.forEach(registro => {
  const fecha = new Date(registro.fechaDeGestion);
  const key = getGroupingFormat(fecha, selectedRange);

  if (pagos[key] !== undefined) {
    pagos[key] += Number(registro.pagodiario) || 0;
    faltantes[key] += Number(registro.faltante) || 0;
    adelantos[key] += Number(registro.adelanto) || 0;
    // Usar el campo monto para los gastos
    gastos[key] += Number(registro.monto) || 0; // Cambiado de registro.gastos a registro.monto
  }
});
    return {
      labels: timeIntervals.map(i => i.label),
      pagosValues: timeIntervals.map(i => pagos[i.key]),
      faltantesValues: timeIntervals.map(i => faltantes[i.key]),
      adelantosValues: timeIntervals.map(i => adelantos[i.key]),
      gastosValues: timeIntervals.map(i => gastos[i.key]),
    };
  }, [registros, selectedRange]);

  // Datos para Chart.js
  const chartData = {
    labels: groupedData.labels,
    datasets: [
      {
        label: 'Pago Diario Total (S/)',
        data: groupedData.pagosValues,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        fill: true,
        tension: 0.2,
        borderWidth: 2,
        pointRadius: 3
      },
      {
        label: 'Faltantes Totales (S/)',
        data: groupedData.faltantesValues,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        fill: true,
        tension: 0.2,
        borderWidth: 2,
        pointRadius: 3
      },
      {
        label: 'Adelantos Totales (S/)',
        data: groupedData.adelantosValues,
        borderColor: 'rgba(255, 206, 86, 1)',
        backgroundColor: 'rgba(255, 206, 86, 0.1)',
        fill: true,
        tension: 0.2,
        borderWidth: 2,
        pointRadius: 3
      },
      
      {
      label: 'Gastos Totales (S/)',
      data: groupedData.gastosValues,
      borderColor: 'rgba(153, 102, 255, 1)',
      backgroundColor: 'rgba(153, 102, 255, 0.1)',
      fill: true,
      tension: 0.2,
      borderWidth: 2,
      pointRadius: 3,
      // Agregar estas propiedades para mejor visualización
      yAxisID: 'y',
      order: 4 // Para controlar el orden de las líneas
    }

    ]
  };

  // Opciones del gráfico
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true, padding: 15 } },
      title: {
        display: true,
        text: `Evolución Gestión Personal - ${getTimeRangeTitle(selectedRange)}`,
        font: { size: 18 },
        padding: { top: 10, bottom: 20 }
      },
      tooltip: {
        callbacks: {
          label: ctx => `${ctx.dataset.label}: S/ ${ctx.raw.toFixed(2)}`
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: getXAxisLabel(selectedRange), font: { weight: 'bold' } },
        ticks: { maxRotation: 45, minRotation: 30, autoSkip: true },
        grid: { display: true, drawBorder: true }
      },
      y: {
        title: { display: true, text: 'Monto (S/)', font: { weight: 'bold' } },
        beginAtZero: true,
        ticks: {
          callback: value => `S/ ${value}`
        }
      }
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md" style={{ height: '450px' }}>
      {/* Selector de rango de tiempo */}
      <div className="flex gap-3 mb-4 justify-center">
        {['day', 'week', 'month', 'year', 'historical'].map(range => (
          <button
            key={range}
            onClick={() => setSelectedRange(range)}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              selectedRange === range
                ? 'bg-blue-600 text-white shadow'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {range === 'day' ? 'Día' :
             range === 'week' ? 'Semana' :
             range === 'month' ? 'Mes' :
             range === 'year' ? 'Año' : 'Histórico'}
          </button>
        ))}
      </div>

      {/* Gráfico de líneas */}
      {groupedData.labels.length === 0 ? (
        <p className="text-center text-gray-500 mt-20">No hay datos para mostrar en este rango.</p>
      ) : (
        <Line data={chartData} options={chartOptions} />
      )}
    </div>
  );
};

export default GestionPersonalChart;
