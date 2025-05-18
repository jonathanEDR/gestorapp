import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const InventoryChart = ({ productos = [] }) => {
  const chartData = useMemo(() => {
    // Procesar productos para obtener datos relevantes
    const data = productos.map(producto => ({
      nombre: producto.nombre,
      cantidad: producto.cantidad || 0,
      cantidadVendida: producto.cantidadVendida || 0,
      precioCompra: producto.precioCompra || 0,
      precioVenta: producto.precio || 0,
      ganancia: (producto.precio - producto.precioCompra) || 0
    }));

    return {
      labels: data.map(item => item.nombre),
      datasets: [
        {
          label: 'Stock Actual',
          data: data.map(item => item.cantidad),
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          borderColor: 'rgba(53, 162, 235, 1)',
          borderWidth: 1,
          borderRadius: 5,
          yAxisID: 'y'
        },
        {
          label: 'Cantidad Vendida',
          data: data.map(item => item.cantidadVendida),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          borderRadius: 5,
          yAxisID: 'y'
        },
        {
          label: 'Precio de Compra (S/)',
          data: data.map(item => item.precioCompra),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
          borderRadius: 5,
          yAxisID: 'y1'
        },
        {
          label: 'Precio de Venta (S/)',
          data: data.map(item => item.precioVenta),
          backgroundColor: 'rgba(255, 159, 64, 0.5)',
          borderColor: 'rgba(255, 159, 64, 1)',
          borderWidth: 1,
          borderRadius: 5,
          yAxisID: 'y1'
        }
      ]
    };
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
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'Control de Inventario',
        font: { size: 16, weight: 'bold' }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            
            if (label.includes('Precio') || label.includes('Ganancia')) {
              return `${label}: S/ ${value.toFixed(2)}`;
            }
            return `${label}: ${Math.round(value)}`;
          },
          footer: function(tooltipItems) {
            const item = tooltipItems[0];
            const index = item.dataIndex;
            const data = chartData.datasets;
            const precioCompra = data[2].data[index];
            const precioVenta = data[3].data[index];
            const ganancia = precioVenta - precioCompra;
            
            return `Ganancia por unidad: S/ ${ganancia.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Cantidad',
          font: { weight: 'bold' }
        },
        min: 0,
        ticks: {
          stepSize: 1
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Precios (S/)',
          font: { weight: 'bold' }
        },
        grid: {
          drawOnChartArea: false
        },
        min: 0
      }
    }
  };

  if (!productos.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg p-4">
        <p className="text-gray-500 mb-4">No hay productos para mostrar</p>
        <p className="text-sm text-gray-400">Agregue productos al inventario</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg">
       <div style={{ 
      height: '600px',
      width: '100%',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
        
      <Bar data={chartData} options={{
        ...options,
        maintainAspectRatio: false,
        responsive: true,
        scales: {
          ...options.scales,
          x: {
            ...options.scales.x,
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              autoSkip: false,
              font: {
                size: 11
              }
            }
          }
        }
      }} />
    </div>
      
      {/* Resumen de Inventario */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-blue-700 font-semibold">Total Productos</h4>
          <p className="text-2xl font-bold">{productos.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="text-green-700 font-semibold">Stock Total</h4>
          <p className="text-2xl font-bold">
            {productos.reduce((sum, p) => sum + (p.cantidad || 0), 0)}
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="text-yellow-700 font-semibold">Total Vendidos</h4>
          <p className="text-2xl font-bold">
            {productos.reduce((sum, p) => sum + (p.cantidadVendida || 0), 0)}
          </p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h4 className="text-red-700 font-semibold">Ganancia Total</h4>
          <p className="text-2xl font-bold">
            S/ {productos.reduce((sum, p) => 
              sum + ((p.precio - p.precioCompra) * (p.cantidadVendida || 0)), 0).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InventoryChart;