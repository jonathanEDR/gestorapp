import React, { useState } from 'react';
import { useMovimiento } from '../../hooks/useMovimiento';

const ModalIngreso = ({ isOpen, onClose, onSuccess }) => {
  const { registrarMovimiento, loading, error, setError } = useMovimiento();
  
  const [formData, setFormData] = useState({
    tipo: 'ingreso',
    categoria: '',
    descripcion: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    metodoPago: 'efectivo',
    numeroComprobante: '',
    observaciones: ''
  });

  const categoriasIngreso = [
    { value: 'venta_directa', label: 'Venta Directa' },
    { value: 'cobro', label: 'Cobro de Cliente' },
    { value: 'devolucion_proveedor', label: 'Devolución de Proveedor' },
    { value: 'prestamo_recibido', label: 'Préstamo Recibido' },
    { value: 'ingreso_extra', label: 'Ingreso Extra' }
  ];

  const metodosPago = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'yape', label: 'Yape' },
    { value: 'plin', label: 'Plin' },
    { value: 'deposito', label: 'Depósito' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'tarjeta', label: 'Tarjeta' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await registrarMovimiento(formData, () => {
        onSuccess();
        resetForm();
        onClose();
      });
    } catch (err) {
      // El error ya se maneja en el hook
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: 'ingreso',
      categoria: '',
      descripcion: '',
      monto: '',
      fecha: new Date().toISOString().split('T')[0],
      metodoPago: 'efectivo',
      numeroComprobante: '',
      observaciones: ''
    });
  };

  const handleClose = () => {
    resetForm();
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl w-full max-w-lg max-h-screen overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-green-700 flex items-center">
            💰 Registrar Ingreso
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Categoría de Ingreso *
              </label>
              <select
                value={formData.categoria}
                onChange={(e) => handleInputChange('categoria', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="">Seleccionar categoría</option>
                {categoriasIngreso.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Monto (S/.) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.monto}
                onChange={(e) => handleInputChange('monto', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fecha *
              </label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => handleInputChange('fecha', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Método de Pago
              </label>
              <select
                value={formData.metodoPago}
                onChange={(e) => handleInputChange('metodoPago', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {metodosPago.map(metodo => (
                  <option key={metodo.value} value={metodo.value}>{metodo.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descripción *
            </label>
            <input
              type="text"
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Describe el ingreso..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                N° Comprobante
              </label>
              <input
                type="text"
                value={formData.numeroComprobante}
                onChange={(e) => handleInputChange('numeroComprobante', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Factura, recibo, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Observaciones
              </label>
              <input
                type="text"
                value={formData.observaciones}
                onChange={(e) => handleInputChange('observaciones', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Notas adicionales"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </div>
              ) : (
                '💰 Registrar Ingreso'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalIngreso;
