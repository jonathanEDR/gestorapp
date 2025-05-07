import React from 'react';
import Slider from "react-slick";
import { Bar, Line } from 'react-chartjs-2'; // Usamos Chart.js para los gráficos

const ChartCarousel = () => {
  // Configuración de los gráficos
  const data = {
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril'],
    datasets: [
      {
        label: 'Ventas',
        data: [65, 59, 80, 81],
        fill: false,
        borderColor: 'rgba(75,192,192,1)',
        tension: 0.1
      }
    ]
  };

  const dataBar = {
    labels: ['Producto A', 'Producto B', 'Producto C'],
    datasets: [
      {
        label: 'Ventas por Producto',
        data: [40, 60, 30],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        borderColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        borderWidth: 1
      }
    ]
  };

  // Configuración del Slick Carousel
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Gráficos de Ventas</h2>
      <Slider {...settings}>
        <div>
          <h3 className="text-xl font-semibold mb-2">Gráfico de Líneas - Ventas</h3>
          <Line data={data} />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Gráfico de Barras - Ventas por Producto</h3>
          <Bar data={dataBar} />
        </div>
        {/* Puedes agregar más gráficos aquí */}
      </Slider>
    </div>
  );
};

export default ChartCarousel;
