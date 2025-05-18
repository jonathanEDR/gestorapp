import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const VentasChart = ({ ventas }) => {
  const data = {
    labels: ventas.map(venta => venta.productoId?.nombre), // Asume que 'productoId' tiene el nombre
    datasets: [
      {
        label: 'Ventas por Producto',
        data: ventas.map(venta => venta.montoTotal), // Suponiendo que 'montoTotal' es el valor de venta
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div>
      <Bar data={data} options={{ responsive: true, plugins: { title: { display: true, text: 'Ventas por Producto' } } }} />
    </div>
  );
};

export default VentasChart;
