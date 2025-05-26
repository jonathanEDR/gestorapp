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

const ProductSalesAnalysisChart = ({ ventas, selectedRange, onRangeChange }) => {

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
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        resultado = ventasConFechasValidas.filter(venta =>
          venta.fechaVenta >= today && venta.fechaVenta < tomorrow
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

        resultado = ventasConFechasValidas.filter(venta =>
          venta.fechaVenta >= startOfWeek && venta.fechaVenta < endOfWeek
        );
        break;
      }
      case 'month': {
        // Usar el primer y último día del mes actual
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        resultado = ventasConFechasValidas.filter(venta =>
          venta.fechaVenta >= startOfMonth && venta.fechaVenta <= endOfMonth
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

    return resultado;
  }, [ventas, selectedRange]);

  // Función para formatear etiquetas en el eje X
  const formatDate = (date, range) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };

    switch (range) {
      case 'day':
        return `${String(date.getHours()).padStart(2, '0')}:00`;
      case 'week':
        return date.toLocaleDateString('es-ES', options);
      case 'month':
        return date.getDate().toString(); // Solo mostrar el día del mes
      case 'year':
        return new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(date);
      default:
        return date.toLocaleDateString('es-ES');
    }
  };

  // Función para agrupar las fechas con normalización
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

  // Agrupar datos por productos y cantidades
  const groupedProductData = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        labels: [],
        cantidadValues: [],
        productosDetalle: {}
      };
    }

    const timeIntervals = generateTimeIntervals(selectedRange);
    const groupedQuantities = {};
    const productosDetalle = {}; // Para guardar el detalle de productos por período

    // Inicializar acumuladores
    timeIntervals.forEach(interval => {
      groupedQuantities[interval.key] = 0;
      productosDetalle[interval.key] = {};
    });

    // Agrupar cantidades y productos
    console.log('Datos filtrados:', filteredData);

// Modifica la sección donde se agrupan los datos en groupedProductData
filteredData.forEach((venta) => {
  console.log('Venta procesada:', {
    cantidad: venta.cantidad,
    producto: venta.productoId?.nombre,
    fecha: venta.fechadeVenta
  });
  
  const cantidad = parseInt(venta.cantidad) || 0;
  // Modificar esta línea para acceder correctamente al nombre del producto
  const nombreProducto = venta.productoId?.nombre || 'Producto sin nombre';
  const date = new Date(venta.fechaVenta);
  const key = getGroupingFormat(date, selectedRange);

  if (key in groupedQuantities) {
    // Sumar cantidades totales
    groupedQuantities[key] += cantidad;
    
    // Agrupar productos específicos
    if (!productosDetalle[key][nombreProducto]) {
      productosDetalle[key][nombreProducto] = 0;
    }
    productosDetalle[key][nombreProducto] += cantidad;
  }
});
    return {
      labels: timeIntervals.map(interval => interval.label),
      cantidadValues: timeIntervals.map(interval => groupedQuantities[interval.key]),
      productosDetalle: productosDetalle,
      timeKeys: timeIntervals.map(interval => interval.key)
    };
  }, [filteredData, selectedRange]);

  // Datos del gráfico
  const chartData = {
    labels: groupedProductData.labels,
    datasets: [
      {
        label: 'Cantidad de Productos Vendidos',
        data: groupedProductData.cantidadValues,
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 8,
        tension: 0.1,
        borderWidth: 3
      }
    ]
  };

  // Opciones del gráfico
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
          font: { size: 12, weight: 'bold' }
        } 
      },
      title: {
        display: true,
        text: `Análisis de Productos Vendidos - ${getTimeRangeTitle(selectedRange)}`,
        font: { size: 16, weight: 'bold' },
        padding: { top: 10, bottom: 20 }
      },
      tooltip: {
        callbacks: {
          title: (context) => {
            return `${getXAxisLabel(selectedRange)}: ${context[0].label}`;
          },
          label: (context) => {
            return `Total productos: ${context.raw} unidades`;
          },
          afterLabel: (context) => {
            const timeKey = groupedProductData.timeKeys[context.dataIndex];
            const productos = groupedProductData.productosDetalle[timeKey];
            
            if (productos && Object.keys(productos).length > 0) {
              const detalleProductos = [];
              detalleProductos.push(''); // Línea en blanco
              detalleProductos.push('Productos vendidos:');
              
              // Ordenar productos por cantidad (mayor a menor)
              const productosOrdenados = Object.entries(productos)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10); // Mostrar máximo 10 productos
              
              productosOrdenados.forEach(([nombre, cantidad]) => {
                detalleProductos.push(`• ${nombre}: ${cantidad} unidades`);
              });
              
              if (Object.keys(productos).length > 10) {
                detalleProductos.push(`• ... y ${Object.keys(productos).length - 10} más`);
              }
              
              return detalleProductos;
            }
            return '';
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        cornerRadius: 8,
        displayColors: false,
        padding: 12,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 11 },
        maxWidth: 300
      }
    },
    scales: {
      x: {
        title: { 
          display: true, 
          text: getXAxisLabel(selectedRange), 
          font: { weight: 'bold', size: 12 } 
        },
        ticks: { 
          autoSkip: true, 
          maxRotation: 45, 
          minRotation: 30,
          font: { size: 10 }
        },
        grid: { 
          display: true, 
          drawBorder: true,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        title: { 
          display: true, 
          text: 'Cantidad de Productos', 
          font: { weight: 'bold', size: 12 } 
        },
        beginAtZero: true,
        grid: { 
          display: true, 
          drawBorder: true,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: { 
          callback: value => `${Math.floor(value)} unidades`,
          font: { size: 10 }
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
      default: return 'Todos los Productos';
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

  // Renderizado
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100">
      <div className="mb-6">
      
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'day', label: 'Hoy' },
            { value: 'week', label: 'Esta Semana' },
            { value: 'month', label: 'Este Mes' },
            { value: 'year', label: 'Este Año' },
            { value: 'historical', label: 'Histórico' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => onRangeChange && onRangeChange(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedRange === option.value
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gráfico */}
      {filteredData.length === 0 ? (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-center">
            <div className="text-4xl mb-2">📦</div>
            <p className="text-lg text-gray-500 font-medium">No hay datos de productos para mostrar</p>
            <p className="text-sm text-gray-400">en el período seleccionado</p>
          </div>
        </div>
      ) : (
        <div style={{ height: '400px' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
};

export default ProductSalesAnalysisChart;