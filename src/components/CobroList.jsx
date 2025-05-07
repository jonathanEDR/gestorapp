import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';

function CobroList() {
  const { getToken } = useAuth();
  const [cobros, setCobros] = useState([]);
  const [newCobro, setNewCobro] = useState({
    colaboradorId: '',
    montoPagado: 0,
    estadoPago: 'parcial',
  });
  const [colaboradores, setColaboradores] = useState([]);
  const [showForm, setShowForm] = useState(false);
  
  // Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCobros(currentPage); // Pasar la página actual
    fetchColaboradores();
  }, [getToken, currentPage]); // Añadir currentPage como dependencia

  const fetchCobros = async (page) => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        alert('No estás autorizado');
        return;
      }

      // Añadir parámetros de paginación a la URL
      const response = await axios.get(`http://localhost:5000/api/cobros?page=${page}&limit=15`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Respuesta del servidor:', response.data); // Depuración para ver la estructura

      // Verificar la estructura de la respuesta y manejarla adecuadamente
      if (Array.isArray(response.data)) {
        // Si es un array como en la versión antigua
        setCobros(response.data);
        setTotalPages(1); // Solo hay una página
      } else if (response.data && Array.isArray(response.data.cobros)) {
        // Si es el nuevo formato paginado
        setCobros(response.data.cobros);
        setTotalPages(response.data.totalPages || 1);
      } else {
        // Si no coincide con ningún formato esperado
        setCobros([]);
        console.error('Formato de respuesta inesperado:', response.data);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error al obtener los cobros:', error);
      setLoading(false);
    }
  };

  const fetchColaboradores = async () => {
    try {
      const token = await getToken();
      if (!token) {
        alert('No estás autorizado');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/colaboradores', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setColaboradores(response.data);
    } catch (error) {
      console.error('Error al obtener los colaboradores:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewCobro((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddCobro = async () => {
    if (!newCobro.colaboradorId || Number(newCobro.montoPagado) <= 0) {
      alert('Por favor, completa todos los campos correctamente.');
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        alert('No estás autorizado');
        return;
      }

      const response = await axios.get(`http://localhost:5000/api/cobros/debtInfo/${newCobro.colaboradorId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const deudaPendiente = response.data.remainingDebt;

      if (Number(newCobro.montoPagado) > deudaPendiente) {
        alert(`El monto pagado no puede exceder la deuda pendiente de ${deudaPendiente}`);
        return;
      }

      const responseCobro = await axios.post('http://localhost:5000/api/cobros', {
        ...newCobro,
        montoPagado: Number(newCobro.montoPagado)
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (responseCobro?.data) {
        // Refrescar la lista después de agregar un nuevo cobro
        fetchCobros(1); // Volver a la primera página después de añadir
        setCurrentPage(1);
        setNewCobro({
          colaboradorId: '',
          montoPagado: 0,
          estadoPago: 'parcial'
        });
        setShowForm(false); // Cerrar el formulario
        alert('Cobro agregado exitosamente');
      }
    } catch (error) {
      console.error('Error al verificar deuda pendiente:', error);
      alert('Error al verificar deuda pendiente');
    }
  };

  const handleDeleteCobro = async (id) => {
    if (!id) {
      alert('ID del cobro no válido.');
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        alert('No estás autorizado');
        return;
      }

      await axios.delete(`http://localhost:5000/api/cobros/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Refrescar la lista después de eliminar
      fetchCobros(currentPage);
      alert('Cobro eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar el cobro:', error);
      alert('Error al eliminar el cobro: ' + (error.response?.data?.message || error.message));
    }
  };

  const toggleFormVisibility = () => {
    setShowForm(prevState => !prevState);
  };

  // Funciones para la paginación
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="list">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Historial de Cobros</h2>
      
      <button
        className="toggle-form-btn bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 mb-4"
        onClick={toggleFormVisibility}
      >
        {showForm ? 'Cancelar' : 'Agregar Cobro'}
      </button>
  
      {loading ? (
        <div className="flex justify-center">
          <p className="text-gray-600">Cargando cobros...</p>
        </div>
      ) : cobros.length > 0 ? (
        <>
          <table className="min-w-full table-auto border-collapse border border-gray-300 mb-4">
            <thead className="bg-gray-100">
              <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">#</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Colaborador</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Monto Pagado</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Fecha de Pago</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Estado de Pago</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cobros.map((cobro, index) => (
                <tr key={cobro._id} className="hover:bg-gray-50">

                  <td className="px-4 py-2 text-sm text-gray-600 border-b">{index + 1}</td>

                  <td className="px-4 py-2 text-sm text-gray-600 border-b">
                    {cobro.colaboradorId && typeof cobro.colaboradorId === 'object'
                      ? cobro.colaboradorId.nombre
                      : 'Desconocido'}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600 border-b">S/ {cobro.montoPagado}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 border-b">{new Date(cobro.fechaPago).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 border-b">{cobro.estadoPago}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 border-b">
                    <button className="text-red-500 hover:text-red-700" onClick={() => handleDeleteCobro(cobro._id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Controles de paginación */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={goToPreviousPage} 
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
              >
                Anterior
              </button>
              <button 
                onClick={goToNextPage} 
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      ) : (
        <p className="text-gray-600">No hay cobros registrados.</p>
      )}
  
      {/* Modal para añadir un nuevo cobro */}
      {showForm && (
        <div className="modal-overlay fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="modal-content bg-white rounded-lg shadow-lg w-96 p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Agregar Cobro</h3>
            
            <select
              name="colaboradorId"
              value={newCobro.colaboradorId}
              onChange={handleChange}
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Seleccionar Colaborador</option>
              {colaboradores.map((colaborador) => (
                <option key={colaborador._id} value={colaborador._id}>
                  {colaborador.nombre}
                </option>
              ))}
            </select>
            
            <input
              type="number"
              name="montoPagado"
              placeholder="Monto Pagado"
              value={newCobro.montoPagado}
              onChange={handleChange}
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            
            <select
              name="estadoPago"
              value={newCobro.estadoPago}
              onChange={handleChange}
              className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="parcial">Parcial</option>
              <option value="total">Total</option>
            </select>
            
            <div className="flex justify-end space-x-2">
              <button 
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                onClick={handleAddCobro}
              >
                Agregar Cobro
              </button>
              <button 
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                onClick={toggleFormVisibility}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CobroList;