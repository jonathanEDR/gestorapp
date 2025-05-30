import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '@clerk/clerk-react';

function GestionPersonal() {
  const { getToken } = useAuth();

  const [registros, setRegistros] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nuevoRegistro, setNuevoRegistro] = useState({
    colaboradorId: '',
    fechaDeGestion: new Date().toISOString().split('T')[0],
    sueldo: '',
    descripcion: '',
    monto: '',
    faltante: 0,
    adelanto: 0,
    diasLaborados: 30
  });
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [registroAEliminar, setRegistroAEliminar] = useState(null);

  useEffect(() => {
    fetchRegistros();
    fetchColaboradores();
  }, []);

  // Obtener todos los registros
  async function fetchRegistros() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('No estás autorizado');

      const response = await api.get('/gestion-personal', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setRegistros(response.data || []);
    } catch (err) {
      console.error('Error al cargar registros:', err);
      setError('Error al cargar registros: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }

  // Obtener lista de colaboradores
  async function fetchColaboradores() {
    try {
      const token = await getToken();
      if (!token) throw new Error('No estás autorizado');

      const response = await api.get('/gestion-personal/colaboradores', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setColaboradores(response.data || []);
    } catch (err) {
      console.error('Error al cargar colaboradores:', err);
      setError('Error al cargar colaboradores: ' + (err.response?.data?.message || err.message));
    }
  }

  // Manejar cambios en los campos
  const handleInputChange = (field, value) => {
    setNuevoRegistro(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Manejar nuevo registro
  async function handleAgregarRegistro(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('No autorizado');

      // Formatear los datos correctamente
      const formData = {
        colaboradorId: nuevoRegistro.colaboradorId,
        fechaDeGestion: nuevoRegistro.fechaDeGestion,
        sueldo: parseFloat(nuevoRegistro.sueldo),
        descripcion: nuevoRegistro.descripcion.trim(),
        monto: parseFloat(nuevoRegistro.monto),
        faltante: parseFloat(nuevoRegistro.faltante) || 0,
        adelanto: parseFloat(nuevoRegistro.adelanto) || 0,
        diasLaborados: 1
      };

      // Validar campos requeridos
      if (!formData.colaboradorId || !formData.descripcion || !formData.monto || !formData.faltante || !formData.adelanto) {
        throw new Error('Por favor complete todos los campos requeridos');
      }

      const response = await api.post(
        '/gestion-personal',
        formData, 
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data) {
        setRegistros(prevRegistros => [response.data, ...prevRegistros]);
        setIsModalOpen(false);
        setNuevoRegistro({
          colaboradorId: '',
          fechaDeGestion: new Date().toISOString().split('T')[0],
          sueldo: '',
          descripcion: '',
          monto: '',
          faltante: 0,
          adelanto: 0,
          diasLaborados: 30
        });
      }
    } catch (err) {
      console.error('Error al agregar registro:', err);
      setError(err.response?.data?.message || err.message || 'Error al agregar registro');
    } finally {
      setLoading(false);
    }
  }


const handleEliminarRegistro = async (id) => {
  if (!id) return;
  
  try {
    setLoading(true);
    setError(null);
    
    const token = await getToken();
    if (!token) throw new Error('No autorizado');

    await api.delete(`/gestion-personal/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Actualizar el estado solo si la eliminación fue exitosa
    setRegistros(prevRegistros => prevRegistros.filter(registro => registro._id !== id));
    
  } catch (err) {
    console.error('Error al eliminar:', err);
    setError('Error al eliminar el registro: ' + (err.message || 'Error desconocido'));
  } finally {
    setLoading(false);
  }
};


  // Mostrar modal de confirmación para eliminar
  function mostrarConfirmacionEliminar(registroId) {
    setRegistroAEliminar(registroId);
    setIsConfirmModalOpen(true);
  }

  // Confirmar eliminación
  async function confirmarEliminarRegistro() {
    if (!registroAEliminar) return;

    try {
      const token = await getToken();
      if (!token) throw new Error('No estás autorizado');

      await api.delete(`/gestion-personal/${registroAEliminar}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setIsConfirmModalOpen(false);
      setRegistroAEliminar(null);
      fetchRegistros();
    } catch (err) {
      console.error('Error al eliminar registro:', err);
      setError('Error al eliminar registro: ' + (err.response?.data?.message || err.message));
      setIsConfirmModalOpen(false);
      setRegistroAEliminar(null);
    }
  }

  // Cancelar eliminación
  function cancelarEliminarRegistro() {
    setIsConfirmModalOpen(false);
    setRegistroAEliminar(null);
  }

  // Función para formatear la fecha
  function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestión de Personal</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={loading}
        >
          Agregar Registro
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-bold">×</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">Cargando...</div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Colaborador</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departamento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sueldo</th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faltante</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Adelanto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Días Laborados</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {registros.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                    No hay registros disponibles
                  </td>
                </tr>
              ) : (
                registros.map((registro) => (
                  <tr key={registro._id}>
                    <td className="px-6 py-4">{registro.colaboradorId?.nombre || 'N/A'}</td>
                    <td className="px-6 py-4">{registro.colaboradorId?.departamento || 'N/A'}</td>
                    <td className="px-6 py-4">S/. {registro.colaboradorId?.sueldo?.toFixed(2) || '0.00'}</td>

                    <td className="px-6 py-4">{formatearFecha(registro.fechaDeGestion)}</td>
                    <td className="px-6 py-4">{registro.descripcion}</td>
                    <td className="px-6 py-4">S/. {registro.monto?.toFixed(2) || '0.00'}</td>
                    <td className="px-6 py-4">S/. {registro.faltante?.toFixed(2) || '0.00'}</td>
                    <td className="px-6 py-4">S/. {registro.adelanto?.toFixed(2) || '0.00'}</td>
                    <td className="px-6 py-4">{registro.diasLaborados || 'N/A'}</td>
                    <td className="px-6 py-4 text-right">
                    
                    <button
  onClick={() => handleEliminarRegistro(registro._id)}
  className="text-red-600 hover:text-red-900"
>
  Eliminar
</button>


                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para agregar registro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-screen overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Nuevo Registro de Gestión</h3>
            <form onSubmit={handleAgregarRegistro} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Colaborador *</label>
                <select
                  value={nuevoRegistro.colaboradorId}
                  onChange={(e) => handleInputChange('colaboradorId', e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Seleccione un colaborador</option>
                  {colaboradores.map(col => (
                    <option key={col._id} value={col._id}>{col.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fecha *</label>
                <input
                  type="date"
                  value={nuevoRegistro.fechaDeGestion}
                  onChange={(e) => handleInputChange('fechaDeGestion', e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>



              <div>
                <label className="block text-sm font-medium mb-1">Descripción del Gasto *</label>
                <input
                  type="text"
                  value={nuevoRegistro.descripcion}
                  onChange={(e) => handleInputChange('descripcion', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Descripción del gasto o trabajo realizado"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Monto *</label>
                <input
                  type="number"
                  step="0.01"
                  value={nuevoRegistro.monto}
                  onChange={(e) => handleInputChange('monto', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Faltante</label>
                <input
                  type="number"
                  step="0.01"
                  value={nuevoRegistro.faltante}
                  onChange={(e) => handleInputChange('faltante', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Adelanto</label>
                <input
                  type="number"
                  step="0.01"
                  value={nuevoRegistro.adelanto}
                  onChange={(e) => handleInputChange('adelanto', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="0.00"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionPersonal;
