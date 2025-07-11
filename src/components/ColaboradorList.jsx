import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api'; // Ajusta la ruta si es necesario
import { useAuth } from '@clerk/clerk-react';
import GestionPersonalChart from './graphics/GestionPersonalChart';


function ColaboradorList() {
  const [colaboradores, setColaboradores] = useState([]);
  const [registros, setRegistros] = useState([]); // Para el gráfico
  const [newColaborador, setNewColaborador] = useState({
    nombre: '',
    email: '',
    telefono: '',
    departamento: '',
    sueldo: 0 // Sueldo inicial, puede ser 0 o se puede omitir
  });
  const [editing, setEditing] = useState(false);
  const [currentColaboradorId, setCurrentColaboradorId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const departamentos = ['Producción', 'Ventas', 'Administración', 'Financiero'];
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);


  // Función para obtener colaboradores
  const fetchColaboradores = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      return; // Esperar a que Clerk cargue y el usuario esté autenticado
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await api.get('/colaboradores', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setColaboradores(response.data);
    } catch (error) {
      console.error('Error al obtener colaboradores:', error);
      setError('Error al cargar colaboradores');
    } finally {
      setIsLoading(false);    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    fetchColaboradores();
    fetchRegistros(); // También cargar registros para el gráfico
  }, [fetchColaboradores]);

  // Función para obtener registros de gestión personal
  const fetchRegistros = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    try {
      const token = await getToken();
      const response = await api.get('/gestion-personal', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRegistros(response.data);
    } catch (error) {
      console.error('Error al obtener registros:', error);
    }
  }, [isLoaded, isSignedIn, getToken]);



  const handleDeleteColaborador = async (id) => {
    try {
      const colaboradorId = id || currentColaboradorId;

      if (!colaboradorId) {
        setError('ID de colaborador no válido');
        return;
      }

      const token = await getToken();
      if (!token) {
        setError('No estás autorizado');
        return;
      }

      console.log(`Intentando eliminar colaborador con ID: ${colaboradorId}`);
      
      const response = await api.delete(`/colaboradores/${colaboradorId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('Respuesta de eliminación:', response);

      if (response.status === 200) {
        setColaboradores(colaboradores.filter(colaborador => colaborador._id !== colaboradorId));
        setEditing(false);
        setCurrentColaboradorId(null);
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error al eliminar colaborador:', error);
      setError(`Error al eliminar: ${error.message}`);
      
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
        console.error('Estado HTTP:', error.response.status);
      }
    }
  };

  const handleAddOrEditColaborador = async () => {
    if (!newColaborador.nombre || !newColaborador.email || !newColaborador.telefono || !newColaborador.departamento || newColaborador.sueldo == null) {
      setError('Por favor, complete todos los campos.');
      return;
    }
  
    try {
          setIsSubmitting(true);

      setError(null);
      const token = await getToken();
      if (!token) {
        setError('No estás autorizado');
        return;
      }
  
      if (editing) {
        await api.put(`/colaboradores/${currentColaboradorId}`, newColaborador, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
  
        await fetchColaboradores(); // Recargar la lista completa
        
        setEditing(false);
        setCurrentColaboradorId(null);
        setNewColaborador({ nombre: '', email: '', telefono: '', departamento: '', sueldo: 0 });  
        setShowForm(false);
      } else {
        await api.post('/colaboradores', newColaborador, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // En lugar de: setColaboradores([...colaboradores, response.data]);
        await fetchColaboradores(); // CAMBIO: Recargar la lista completa

        setNewColaborador({ nombre: '', email: '', telefono: '', departamento: '', sueldo: 0 });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error al gestionar colaborador:', error);
      setError(`Error: ${error.message}`);
   
    } finally {
    setIsSubmitting(false);
    }
  };
  
  const handleEditColaborador = (colaborador) => {
    setEditing(true);
    setCurrentColaboradorId(colaborador._id);
    setNewColaborador({
      nombre: colaborador.nombre,
      email: colaborador.email,
      telefono: colaborador.telefono,
      departamento: colaborador.departamento,
      sueldo: colaborador.sueldo
    });
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setCurrentColaboradorId(null);
    setNewColaborador({ nombre: '', email: '', telefono: '', departamento: '', sueldo: 0 });
    setShowForm(false);
  };
  const toggleFormVisibility = () => {
    if (showForm && editing) {
      handleCancelEdit();
    } else {
      setShowForm(prevState => !prevState);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Colaboradores</h1>
        
        <button 
          onClick={toggleFormVisibility}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {showForm ? 'Cancelar' : (editing ? 'Editar Colaborador' : 'Agregar Colaborador')}
        </button>
      </div>



      {showForm && (
  <div className="modal-overlay fixed inset-0 flex items-center justify-center z-50">
    <div className="modal-content bg-white rounded-lg shadow-xl w-96 p-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">{editing ? 'Editar Colaborador' : 'Agregar Colaborador'}</h3>

      {/* Campos de formulario */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Nombre:</label>
          <input
            type="text"
            value={newColaborador.nombre}
            onChange={(e) => setNewColaborador({ ...newColaborador, nombre: e.target.value })}
            className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Email:</label>
          <input
            type="email"
            value={newColaborador.email}
            onChange={(e) => setNewColaborador({ ...newColaborador, email: e.target.value })}
            className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700">Teléfono:</label>
          <input
            type="text"
            value={newColaborador.telefono}
            onChange={(e) => setNewColaborador({ ...newColaborador, telefono: e.target.value })}
            className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

  <div className="mb-4">
    <label className="block text-gray-700 text-sm font-bold mb-2">
      Departamento *
    </label>
    <select
      name="departamento"
      value={newColaborador.departamento}
      onChange={(e) => setNewColaborador({ ...newColaborador, departamento: e.target.value })}
      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
      required
    >
      <option value="">Seleccione un departamento</option>
      {departamentos.map(dep => (
        <option key={dep} value={dep}>{dep}</option>
      ))}
    </select>
  </div>

  <div className="mb-4">
    <label className="block text-gray-700 text-sm font-bold mb-2">
      Sueldo *
    </label>
    <input
      type="number"
      value={newColaborador.sueldo}
      onChange={(e) => setNewColaborador({ ...newColaborador, sueldo: e.target.value })}
      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
      required
    />
  </div>


        {/* Botones del modal */}
        <div className="flex space-x-4 justify-end">
          <button
            onClick={handleAddOrEditColaborador}
            disabled={isSubmitting}
            className={`px-6 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600
              ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Guardando...' : (editing ? 'Actualizar' : 'Agregar')}
          </button>
          {editing && (
            <button
              onClick={() => handleDeleteColaborador(currentColaboradorId)}
              className="px-6 py-2 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600"
            >
              Borrar
            </button>
          )}
          <button
            onClick={handleCancelEdit}
            className="px-6 py-2 bg-gray-500 text-white font-semibold rounded-md hover:bg-gray-600"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )}


      {isLoading ? (
        <p>Cargando colaboradores...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b"> # </th>
                <th className="py-2 px-4 border-b">Nombre</th>
                <th className="py-2 px-4 border-b">Email</th>
                <th className="py-2 px-4 border-b">Teléfono</th>
                <th className="py-2 px-4 border-b">Departamento</th>
                <th className="py-2 px-4 border-b">Sueldo</th>
                <th className="py-2 px-4 border-b">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {colaboradores.length > 0 ? (
                colaboradores.map((colaborador, index) => (
                  <tr key={colaborador._id}>
                    <td className="py-2 px-4 border-b">{index + 1}</td>
                    <td className="py-2 px-4 border-b">{colaborador.nombre}</td>
                    <td className="py-2 px-4 border-b">{colaborador.email}</td>
                    <td className="py-2 px-4 border-b">{colaborador.telefono}</td>
                    <td className="py-2 px-4 border-b">{colaborador.departamento}</td>
                    <td className="py-2 px-4 border-b">{colaborador.sueldo}</td>
                    <td className="py-2 px-4 border-b">
                      <button
                        onClick={() => handleEditColaborador(colaborador)}
                        className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded mr-2"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-2 px-4 text-center">
                    No hay colaboradores registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>        </div>
        
      )}

      {/* Gráfico de Gestión Personal */}
      <div className="mt-12 bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold mb-6 text-gray-800">
          Gráfico de Gestión Personal de Colaboradores
        </h2>
        
        <div className="h-[500px] w-full">
          <GestionPersonalChart registros={registros} />
        </div>
      </div>

    </div>
  );
}

export default ColaboradorList;
