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

const SalesOverTimeChart = ({ ventas, devoluciones, selectedRange }) => {

  // Debug: verificar qué se está recibiendo
  console.log('🔍 DEBUG: Props recibidas en SalesOverTimeChart:', {
    ventasCount: ventas?.length || 0,
    devolucionesCount: devoluciones?.length || 0,
    selectedRange
  });

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
    if (!ventas || ventas.length === 0) return [];    const ventasConFechasValidas = ventas.map(venta => {
      let fechaValida = parseDate(venta.fechaVenta || venta.fechadeVenta); // Manejar ambos nombres
      return {
        ...venta,
        fechaVenta: fechaValida,
        fechaOriginal: venta.fechaVenta || venta.fechadeVenta
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

  // Filtrar devoluciones por separado con el mismo rango
  const filteredDevoluciones = useMemo(() => {
    if (!devoluciones || !Array.isArray(devoluciones)) {
      console.log('🔍 DEBUG: No hay devoluciones para filtrar');
      return [];
    }

    console.log('🔍 DEBUG: Filtrando devoluciones para rango:', selectedRange);
    console.log('🔍 DEBUG: Devoluciones totales:', devoluciones.length);

    const now = new Date();

    switch (selectedRange) {
      case 'day': {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        return devoluciones.filter(dev => {
          if (!dev.fechaDevolucion) return false;
          const devDate = parseDate(dev.fechaDevolucion);
          return devDate >= today && devDate < tomorrow;
        });
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

        return devoluciones.filter(dev => {
          if (!dev.fechaDevolucion) return false;
          const devDate = parseDate(dev.fechaDevolucion);
          return devDate >= startOfWeek && devDate < endOfWeek;
        });
      }
      case 'month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        return devoluciones.filter(dev => {
          if (!dev.fechaDevolucion) return false;
          const devDate = parseDate(dev.fechaDevolucion);
          return devDate >= startOfMonth && devDate <= endOfMonth;
        });
      }
      case 'year': {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
        return devoluciones.filter(dev => {
          if (!dev.fechaDevolucion) return false;
          const devDate = parseDate(dev.fechaDevolucion);
          return devDate >= startOfYear && devDate < endOfYear;
        });
      }
      case 'historical':
      default:
        return devoluciones;
    }
  }, [devoluciones, selectedRange]);

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

  // Función corregida para agrupar las fechas con normalización (minutos y segundos en cero)
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

  // Agrupar datos en ventas, devoluciones y calcular ventas netas
  const groupedData = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        labels: [],
        ventasValues: [],
        devolucionesValues: [],
        ventasNetasValues: []
      };
    }    const timeIntervals = generateTimeIntervals(selectedRange);
    const groupedSales = {};
    const groupedDevoluciones = {};
    const groupedVentasNetas = {};
    const groupedVentasBrutas = {}; // Nueva variable para ventas brutas

    // Inicializar acumuladores a cero
    timeIntervals.forEach(interval => {
      groupedSales[interval.key] = 0;
      groupedDevoluciones[interval.key] = 0;
      groupedVentasNetas[interval.key] = 0;
      groupedVentasBrutas[interval.key] = 0; // Inicializar ventas brutas
    });    // Agrupar ventas - Validar que filteredData existe y es un array
    if (filteredData && Array.isArray(filteredData)) {
      filteredData.forEach((venta) => {
        const montoTotal = parseFloat(venta.montoTotal) || 0;
        const date = new Date(venta.fechaVenta);
        const key = getGroupingFormat(date, selectedRange);

        if (key in groupedSales) {
          groupedSales[key] += montoTotal;
        }
      });
    } else {
      console.warn('🔍 DEBUG: filteredData no es un array válido:', filteredData);
    }// Agrupar devoluciones si existen
    if (filteredDevoluciones && Array.isArray(filteredDevoluciones)) {
      console.log('🔍 DEBUG: Devoluciones filtradas recibidas en gráfico:', filteredDevoluciones); // Debug log      
      filteredDevoluciones.forEach((devolucion) => {
        if (devolucion && devolucion.fechaDevolucion && devolucion.montoDevolucion) {
          const montoDevolucion = parseFloat(devolucion.montoDevolucion) || 0;
          const date = parseDate(devolucion.fechaDevolucion);
          const key = getGroupingFormat(date, selectedRange);

          console.log('🔍 DEBUG: Procesando devolución:', {
            fecha: devolucion.fechaDevolucion,
            fechaParsed: date,
            monto: montoDevolucion,
            key: key,
            existeKey: key in groupedDevoluciones
          }); // Debug log

          if (key in groupedDevoluciones) {
            groupedDevoluciones[key] += montoDevolucion;
            console.log('🔍 DEBUG: Devolución agregada, nuevo total para', key, ':', groupedDevoluciones[key]); // Debug log
          }
        } else {
          console.log('🔍 DEBUG: Devolución inválida:', devolucion); // Debug log
        }
      });
    } else {
      console.log('🔍 DEBUG: No hay devoluciones o no es un array:', devoluciones); // Debug log
    }    // Calcular ventas netas (las ventas actuales ya tienen devoluciones descontadas)
    timeIntervals.forEach(interval => {
      groupedVentasNetas[interval.key] = groupedSales[interval.key]; // Las ventas actuales son netas
    });

    // Calcular ventas brutas (ventas netas + devoluciones)
    timeIntervals.forEach(interval => {
      groupedVentasBrutas[interval.key] = groupedSales[interval.key] + groupedDevoluciones[interval.key];
    });    // Debug final de datos
    console.log('🔍 DEBUG: Datos finales del gráfico:', {
      labels: timeIntervals.map(interval => interval.label),
      ventasBrutas: timeIntervals.map(interval => groupedVentasBrutas[interval.key]),
      devoluciones: timeIntervals.map(interval => groupedDevoluciones[interval.key]),
      ventasNetas: timeIntervals.map(interval => groupedVentasNetas[interval.key])
    });return {
      labels: timeIntervals.map(interval => interval.label),
      ventasBrutasValues: timeIntervals.map(interval => groupedVentasBrutas[interval.key]), // Brutas = Netas + Devoluciones
      devolucionesValues: timeIntervals.map(interval => groupedDevoluciones[interval.key]),
      ventasNetasValues: timeIntervals.map(interval => groupedVentasNetas[interval.key]) // Netas = Ventas actuales
    };
  }, [filteredData, filteredDevoluciones, selectedRange]);

  
  // Datos del gráfico
  const chartData = {
    labels: groupedData.labels,
    datasets: [      {
        label: 'Ventas Brutas (S/)',
        data: groupedData.ventasBrutasValues, // Ahora usa las ventas brutas calculadas
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        fill: true,
        pointRadius: 4,
        tension: 0.1,
        borderWidth: 2
      },
      {
        label: 'Devoluciones (S/)',
        data: groupedData.devolucionesValues,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        fill: true,
        pointRadius: 3,
        tension: 0.1,
        borderWidth: 2
      },
      {
        label: 'Ventas Netas (S/)',
        data: groupedData.ventasNetasValues,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        fill: true,
        pointRadius: 3,
        tension: 0.1,
        borderWidth: 2
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
        text: `Evolución de Ventas - ${getTimeRangeTitle(selectedRange)}`,
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
        title: { display: true, text: getXAxisLabel(selectedRange), font: { weight: 'bold' } },
        ticks: { autoSkip: true, maxRotation: 45, minRotation: 30 },
        grid: { display: true, drawBorder: true }
      },
      y: {
        title: { display: true, text: 'Monto (S/)', font: { weight: 'bold' } },
        beginAtZero: true,
        grid: { display: true, drawBorder: true },
        ticks: { callback: value => `S/ ${value}` }
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
  // Renderizado
  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-lg text-gray-500">No hay datos de ventas para mostrar en el período seleccionado</p>
      </div>
    );
  }


    return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4">
        <div style={{ height: '450px', width: '100%' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Resumen en cards con los totales de ventas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border-t border-gray-200">
        <div className="bg-emerald-50 p-4 rounded-lg">
          <h4 className="text-emerald-700 font-semibold text-sm">
            Ventas Brutas - {getTimeRangeTitle(selectedRange)}
          </h4>          <p className="text-xl font-bold">
            S/ {(groupedData?.ventasBrutasValues && Array.isArray(groupedData.ventasBrutasValues)) 
              ? groupedData.ventasBrutasValues.reduce((a, b) => a + b, 0).toFixed(2) 
              : '0.00'}
          </p>
          <p className="text-xs text-emerald-600 mt-1">
            {selectedRange === 'day' ? 'Hoy' : 
             selectedRange === 'week' ? 'Esta semana' :
             selectedRange === 'month' ? 'Este mes' :
             selectedRange === 'year' ? 'Este año' : 'Total histórico'}
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-blue-700 font-semibold text-sm">
            Ventas Netas - {getTimeRangeTitle(selectedRange)}
          </h4>          <p className="text-xl font-bold">
            S/ {(groupedData?.ventasNetasValues && Array.isArray(groupedData.ventasNetasValues)) 
              ? groupedData.ventasNetasValues.reduce((a, b) => a + b, 0).toFixed(2) 
              : '0.00'}
          </p>          <p className="text-xs text-blue-600 mt-1">
            {(groupedData?.ventasNetasValues && groupedData?.ventasBrutasValues && 
              Array.isArray(groupedData.ventasNetasValues) && Array.isArray(groupedData.ventasBrutasValues)) 
              ? ((groupedData.ventasNetasValues.reduce((a, b) => a + b, 0) / groupedData.ventasBrutasValues.reduce((a, b) => a + b, 0)) * 100).toFixed(1) + '% de ventas brutas'
              : '0.0% de ventas brutas'}
          </p>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <h4 className="text-red-700 font-semibold text-sm">
            Devoluciones - {getTimeRangeTitle(selectedRange)}
          </h4>          <p className="text-xl font-bold">
            S/ {(groupedData?.devolucionesValues && Array.isArray(groupedData.devolucionesValues)) 
              ? groupedData.devolucionesValues.reduce((a, b) => a + b, 0).toFixed(2) 
              : '0.00'}
          </p>          <p className="text-xs text-red-600 mt-1">
            {(groupedData?.devolucionesValues && groupedData?.ventasBrutasValues && 
              Array.isArray(groupedData.devolucionesValues) && Array.isArray(groupedData.ventasBrutasValues)) 
              ? ((groupedData.devolucionesValues.reduce((a, b) => a + b, 0) / groupedData.ventasBrutasValues.reduce((a, b) => a + b, 0)) * 100).toFixed(1) + '% de ventas brutas'
              : '0.0% de ventas brutas'}
          </p>
        </div>        <div className="bg-indigo-50 p-4 rounded-lg">
          <h4 className="text-indigo-700 font-semibold text-sm">
            Cantidad Vendida - {getTimeRangeTitle(selectedRange)}
          </h4>          <p className="text-xl font-bold">
            {(filteredData && Array.isArray(filteredData)) 
              ? (() => {
                  console.log('🔍 DEBUG: Calculando cantidad vendida. Muestra de ventas:', filteredData.slice(0, 2));
                  
                  const totalCantidad = filteredData.reduce((total, venta) => {
                    // Si la venta tiene detalles, sumar las cantidades de cada detalle
                    if (venta.detalles && Array.isArray(venta.detalles)) {
                      const cantidadVenta = venta.detalles.reduce((subtotal, detalle) => {
                        return subtotal + (parseInt(detalle.cantidad) || 0);
                      }, 0);
                      console.log(`🔍 DEBUG: Venta ${venta._id} con detalles: ${cantidadVenta} unidades`);
                      return total + cantidadVenta;
                    }
                    // Si no tiene detalles, usar el campo cantidad directo (fallback)
                    const cantidadDirecta = parseInt(venta.cantidad) || 0;
                    console.log(`🔍 DEBUG: Venta ${venta._id} sin detalles: ${cantidadDirecta} unidades`);
                    return total + cantidadDirecta;
                  }, 0);
                  
                  console.log('🔍 DEBUG: Total cantidad vendida calculada:', totalCantidad);
                  return totalCantidad;
                })()
              : 0} unidades
          </p>
          <p className="text-xs text-indigo-600 mt-1">
            En {(filteredData && Array.isArray(filteredData)) ? filteredData.length : 0} transacciones
          </p>
        </div>
      </div>
    </div>
  );
};

export default SalesOverTimeChart;
