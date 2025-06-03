import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ImprovedInventoryChart = ({ productos = [] }) => {
  const chartData = useMemo(() => {
    // Procesar productos y calcular métricas
    const data = productos.map(producto => {
      const stockInicial = producto.cantidad || 0;
      const cantidadVendida = producto.cantidadVendida || 0;
      const stockDisponible = stockInicial - cantidadVendida;
      const precioCompra = producto.precioCompra || 0;
      const precioVenta = producto.precio || 0;
      const gananciaPorUnidad = precioVenta - precioCompra;
      const gananciaTotal = gananciaPorUnidad * cantidadVendida;
      
      // Determinar estado del stock
      let estadoStock = 'normal';
      const porcentajeVendido = stockInicial > 0 ? (cantidadVendida / stockInicial) * 100 : 0;
      
      if (stockDisponible === 0) {
        estadoStock = 'agotado';
      } else if (stockDisponible <= 5 || porcentajeVendido >= 80) {
        estadoStock = 'critico';
      } else if (stockDisponible <= 10 || porcentajeVendido >= 60) {
        estadoStock = 'bajo';
      }
      
      return {
        nombre: producto.nombre,
        stockInicial,
        cantidadVendida,
        stockDisponible: Math.max(0, stockDisponible),
        precioCompra,
        precioVenta,
        gananciaPorUnidad,
        gananciaTotal,
        estadoStock,
        porcentajeVendido
      };
    });

    // Ordenar por porcentaje vendido (productos más vendidos primero)
    data.sort((a, b) => b.porcentajeVendido - a.porcentajeVendido);

    return {
      labels: data.map(item => item.nombre),
      datasets: [
        {
          label: 'Stock Vendido',
          data: data.map(item => item.cantidadVendida),
          backgroundColor: data.map(item => {
            switch(item.estadoStock) {
              case 'agotado': return 'rgba(239, 68, 68, 0.8)'; // Rojo - agotado
              case 'critico': return 'rgba(245, 158, 11, 0.8)'; // Amarillo - crítico
              case 'bajo': return 'rgba(59, 130, 246, 0.8)'; // Azul - bajo
              default: return 'rgba(34, 197, 94, 0.8)'; // Verde - normal
            }
          }),
          borderColor: data.map(item => {
            switch(item.estadoStock) {
              case 'agotado': return 'rgba(239, 68, 68, 1)';
              case 'critico': return 'rgba(245, 158, 11, 1)';
              case 'bajo': return 'rgba(59, 130, 246, 1)';
              default: return 'rgba(34, 197, 94, 1)';
            }
          }),
          borderWidth: 1,
          stack: 'stock'
        },
        {
          label: 'Stock Disponible',
          data: data.map(item => item.stockDisponible),
          backgroundColor: 'rgba(156, 163, 175, 0.6)', // Gris claro
          borderColor: 'rgba(156, 163, 175, 0.8)',
          borderWidth: 1,
          stack: 'stock'
        }
      ]
    };
  }, [productos]);

  // Calcular estadísticas para el resumen
  const stats = useMemo(() => {
    return productos.reduce((acc, producto) => {
      const stockInicial = producto.cantidad || 0;
      const cantidadVendida = producto.cantidadVendida || 0;
      const stockDisponible = Math.max(0, stockInicial - cantidadVendida);
      const gananciaPorUnidad = (producto.precio || 0) - (producto.precioCompra || 0);
      const gananciaTotal = gananciaPorUnidad * cantidadVendida;
      
      acc.totalProductos++;
      acc.stockTotal += stockInicial;
      acc.totalVendidos += cantidadVendida;
      acc.stockDisponible += stockDisponible;
      acc.gananciaTotal += gananciaTotal;
      
      // Contar productos por estado
      if (stockDisponible === 0) {
        acc.productosAgotados++;
      } else if (stockDisponible <= 5) {
        acc.productosCriticos++;
      } else if (stockDisponible <= 10) {
        acc.productosBajos++;
      }
      
      return acc;
    }, {
      totalProductos: 0,
      stockTotal: 0,
      totalVendidos: 0,
      stockDisponible: 0,
      gananciaTotal: 0,
      productosAgotados: 0,
      productosCriticos: 0,
      productosBajos: 0
    });
  }, [productos]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      title: {
        display: true,
        text: 'Control de Inventario - Stock y Ventas',
        font: { 
          size: 18, 
          weight: 'bold' 
        },
        padding: 20
      },
      tooltip: {
        callbacks: {
          title: function(context) {
            return context[0].label;
          },
          label: function(context) {
            const datasetLabel = context.dataset.label;
            const value = context.parsed.y;
            const dataIndex = context.dataIndex;
            
            // Obtener datos adicionales del producto
            const producto = productos[dataIndex];
            if (!producto) return `${datasetLabel}: ${value}`;
            
            const stockInicial = producto.cantidad || 0;
            const cantidadVendida = producto.cantidadVendida || 0;
            const porcentajeVendido = stockInicial > 0 ? ((cantidadVendida / stockInicial) * 100).toFixed(1) : 0;
            
            if (datasetLabel === 'Stock Vendido') {
              return `${datasetLabel}: ${value} (${porcentajeVendido}%)`;
            }
            return `${datasetLabel}: ${value}`;
          },
          footer: function(tooltipItems) {
            if (tooltipItems.length === 0) return '';
            
            const dataIndex = tooltipItems[0].dataIndex;
            const producto = productos[dataIndex];
            
            if (!producto) return '';
            
            const gananciaPorUnidad = (producto.precio || 0) - (producto.precioCompra || 0);
            const gananciaTotal = gananciaPorUnidad * (producto.cantidadVendida || 0);
            
            return [
              `Ganancia por unidad: S/ ${gananciaPorUnidad.toFixed(2)}`,
              `Ganancia total: S/ ${gananciaTotal.toFixed(2)}`
            ];
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        footerFont: { size: 12 },
        padding: 12
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Cantidad de Productos',
          font: { 
            weight: 'bold',
            size: 14
          }
        },
        ticks: {
          stepSize: 1,
          font: {
            size: 12
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  };

  if (!productos.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg p-4">
        <div className="text-6xl mb-4">📦</div>
        <p className="text-gray-600 text-lg mb-2">No hay productos para mostrar</p>
        <p className="text-sm text-gray-400">Agregue productos al inventario para ver las estadísticas</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      {/* Gráfico Principal */}
      <div style={{ 
        height: '500px',
        width: '100%',
        margin: '0 auto'
      }}>
        <Bar data={chartData} options={options} />
      </div>
      
      {/* Leyenda de Colores */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Estado del Stock (Stock Vendido):</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span>Normal ({"<60% vendido"})</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
            <span>Stock Bajo (60-80% vendido)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
            <span>Stock Crítico ({">80% vendido"})</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <span>Agotado (100% vendido)</span>
          </div>
        </div>
      </div>

      {/* Resumen Mejorado */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
          <h4 className="text-blue-700 font-semibold text-sm">Total Productos</h4>
          <p className="text-2xl font-bold text-blue-800">{stats.totalProductos}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
          <h4 className="text-green-700 font-semibold text-sm">Stock Disponible</h4>
          <p className="text-2xl font-bold text-green-800">{stats.stockDisponible}</p>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
          <h4 className="text-purple-700 font-semibold text-sm">Total Vendidos</h4>
          <p className="text-2xl font-bold text-purple-800">{stats.totalVendidos}</p>
        </div>
      </div>

      {/* Alertas de Stock */}
      {(stats.productosAgotados > 0 || stats.productosCriticos > 0 || stats.productosBajos > 0) && (
        <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
          <h4 className="text-yellow-800 font-semibold mb-2">⚠️ Alertas de Inventario</h4>
          <div className="text-sm text-yellow-700 space-y-1">
            {stats.productosAgotados > 0 && (
              <p>• {stats.productosAgotados} producto(s) agotado(s)</p>
            )}
            {stats.productosCriticos > 0 && (
              <p>• {stats.productosCriticos} producto(s) con stock crítico</p>
            )}
            {stats.productosBajos > 0 && (
              <p>• {stats.productosBajos} producto(s) con stock bajo</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprovedInventoryChart;