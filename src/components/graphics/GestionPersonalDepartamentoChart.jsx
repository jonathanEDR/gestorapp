import React, { useMemo, useState } from 'react';
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

// Orden predefinido de departamentos
const ORDEN_DEPARTAMENTOS = ['Producción', 'Ventas', 'Administración'];

const GestionPersonalDepartamentoChart = ({ registros, selectedRange }) => {
 

    const processData = useMemo(() => {
    if (!registros || !Array.isArray(registros)) return {};

    // Filtrar por rango de fecha
    const now = new Date();
    const filteredRegistros = registros.filter(registro => {
      const fecha = new Date(registro.fechaDeGestion);
      switch (selectedRange) {
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return fecha >= weekAgo;
        case 'month':
          return fecha.getMonth() === now.getMonth() && 
                 fecha.getFullYear() === now.getFullYear();
        case 'year':
          return fecha.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });

    // Inicializar estructura de datos por departamento
    const departamentos = ORDEN_DEPARTAMENTOS.reduce((acc, depto) => {
      acc[depto] = {
        total: 0,
        colaboradores: {}
      };
      return acc;
    }, {});

    // Procesar registros
    filteredRegistros.forEach(registro => {
      const depto = registro.colaboradorId?.departamento || 'Sin Departamento';
      const colaboradorId = registro.colaboradorId?._id;
      const colaboradorNombre = registro.colaboradorId?.nombre || 'Sin Nombre';
      
      if (ORDEN_DEPARTAMENTOS.includes(depto)) {
        // Inicializar colaborador si no existe
        if (!departamentos[depto].colaboradores[colaboradorId]) {
          departamentos[depto].colaboradores[colaboradorId] = {
            nombre: colaboradorNombre,
            pagoTotal: 0,
            gastoTotal: 0
          };
        }

        // Actualizar totales del colaborador
        departamentos[depto].colaboradores[colaboradorId].pagoTotal += 
          Number(registro.pagodiario) || 0;
        departamentos[depto].colaboradores[colaboradorId].gastoTotal += 
          Number(registro.monto) || 0;

        // Actualizar total del departamento
        departamentos[depto].total += 
          (Number(registro.pagodiario) || 0) + (Number(registro.monto) || 0);
      }
    });

    return departamentos;
  }, [registros, selectedRange]);

  // Calcular total general
  const totalGeneral = useMemo(() => {
    return ORDEN_DEPARTAMENTOS.reduce((total, depto) => {
      return total + processData[depto]?.total || 0;
    }, 0);
  }, [processData]);

  const chartData = {
    labels: ORDEN_DEPARTAMENTOS,
    datasets: [
      {
        label: 'Pagos Totales',
        data: ORDEN_DEPARTAMENTOS.map(depto => 
          Object.values(processData[depto]?.colaboradores || {})
            .reduce((sum, col) => sum + col.pagoTotal, 0)
        ),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      },
      {
        label: 'Gastos Totales',
        data: ORDEN_DEPARTAMENTOS.map(depto =>
          Object.values(processData[depto]?.colaboradores || {})
            .reduce((sum, col) => sum + col.gastoTotal, 0)
        ),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Distribución de Pagos y Gastos por Departamento'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Monto (S/)'
        }
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {/* Selector de rango mejorado */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Informe de Gestión por Departamentos
        </h2>
       
        
      </div>

      {/* Gráfico de barras */}
      <div className="mb-8 bg-white p-4 rounded-lg border border-gray-200">
        <Bar data={chartData} options={chartOptions} height={80} />
      </div>


      {/* Resumen General */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Resumen General</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {ORDEN_DEPARTAMENTOS.map(depto => (
            <div key={depto} className="p-3 bg-white rounded shadow">
              <p className="text-sm font-medium text-gray-600">{depto}</p>
              <p className="text-lg font-bold text-gray-900">
                S/ {(processData[depto]?.total || 0).toFixed(2)}
              </p>
            </div>
          ))}
          <div className="p-3 bg-blue-50 rounded shadow">
            <p className="text-sm font-medium text-blue-600">Total General</p>
            <p className="text-lg font-bold text-blue-900">
              S/ {totalGeneral.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Detalle por Departamento */}
      {ORDEN_DEPARTAMENTOS.map(depto => (
        <div key={depto} className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
            {depto}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Colaborador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pago Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gasto Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(processData[depto]?.colaboradores || {}).map(([colaboradorId, datos]) => (
                  <tr key={colaboradorId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {datos.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      S/ {datos.pagoTotal.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      S/ {datos.gastoTotal.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      S/ {(datos.pagoTotal + datos.gastoTotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    Total {depto}
                  </td>
                  <td colSpan="3" className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                    S/ {(processData[depto]?.total || 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}
      
{/* Resumen General de Gastos por Departamento */}
<div className="mt-12 mb-8">
  <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
    Resumen General de Gastos por Departamento
  </h3>
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Departamento
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Total Pagos
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Total Gastos
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Total General
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {ORDEN_DEPARTAMENTOS.map(depto => {
          const departamentoData = processData[depto] || {};
          const totalPagos = Object.values(departamentoData.colaboradores || {})
            .reduce((sum, col) => sum + col.pagoTotal, 0);
          const totalGastos = Object.values(departamentoData.colaboradores || {})
            .reduce((sum, col) => sum + col.gastoTotal, 0);
          const totalDepartamento = totalPagos + totalGastos;

          return (
            <tr key={depto} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {depto}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                S/ {totalPagos.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                S/ {totalGastos.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                S/ {totalDepartamento.toFixed(2)}
              </td>
            </tr>
          );
        })}
        {/* Fila de Total General */}
        <tr className="bg-gray-100 font-bold">
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            TOTAL GENERAL
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            S/ {ORDEN_DEPARTAMENTOS.reduce((sum, depto) => 
              sum + Object.values(processData[depto]?.colaboradores || {})
                .reduce((total, col) => total + col.pagoTotal, 0)
              , 0).toFixed(2)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            S/ {ORDEN_DEPARTAMENTOS.reduce((sum, depto) => 
              sum + Object.values(processData[depto]?.colaboradores || {})
                .reduce((total, col) => total + col.gastoTotal, 0)
              , 0).toFixed(2)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700 font-bold">
            S/ {totalGeneral.toFixed(2)}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
    </div>
  );
};

export default GestionPersonalDepartamentoChart;