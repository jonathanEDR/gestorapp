import React from 'react';

const CobroModal = ({
  showForm,
  colaboradores,
  newCobro,
  handleChange,
  handleAddCobro,
  toggleFormVisibility,
  isSubmittingCobro
}) => {
  if (!showForm) return null;
  return (
    <div className="modal-overlay fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="modal-content bg-white rounded-lg shadow-lg w-96 p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Agregar Cobro</h3>
          {/* Select Venta con deuda pendiente */}
        <div className="mb-4">
          <label htmlFor="ventaSeleccionada" className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Venta con Deuda Pendiente
          </label>
          {colaboradores.length > 0 ? (
            <>
              <select
                name="ventaSeleccionada"
                id="ventaSeleccionada"
                value={newCobro.ventaId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Seleccione una venta</option>
                {colaboradores
                  .filter(venta => venta.deudaPendiente > 0)
                  .map((venta) => (
                    <option 
                      key={venta._id} 
                      value={venta._id}
                      className="py-2"
                    >
                      {venta.displayText}
                    </option>
                ))}
              </select>
              
              {/* Información adicional de la venta seleccionada */}
              {newCobro.ventaId && (                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-800">
                      Colaborador:
                    </span>
                    <span className="text-sm text-blue-600">
                      {colaboradores.find(v => v._id === newCobro.ventaId)?.colaboradorNombre}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-medium text-blue-800">
                      Fecha de venta:
                    </span>
                    <span className="text-sm text-blue-600">
                      {colaboradores.find(v => v._id === newCobro.ventaId)?.fechaFormateada}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-medium text-blue-800">
                      Monto total:
                    </span>
                    <span className="text-sm text-gray-600">
                      S/ {colaboradores.find(v => v._id === newCobro.ventaId)?.montoTotal?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-medium text-blue-800">
                      Ya pagado:
                    </span>
                    <span className="text-sm text-green-600">
                      S/ {colaboradores.find(v => v._id === newCobro.ventaId)?.montoPagado?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-medium text-blue-800">
                      Deuda pendiente:
                    </span>
                    <span className="text-sm font-bold text-red-600">
                      S/ {colaboradores.find(v => v._id === newCobro.ventaId)?.deudaPendiente?.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (            <div className="mt-2 p-4 bg-gray-50 rounded-md border border-gray-200">
              <div className="flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p className="text-gray-600 text-center">No hay ventas con deudas pendientes</p>
              </div>
              <p className="text-xs text-gray-500 text-center mt-1">
                Todas las ventas están completamente pagadas
              </p>
            </div>
          )}
        </div>

        {newCobro.ventaId && (
          <>
            {/* Campo para Fecha de Pago */}
            <div className="mb-4">
              <label htmlFor="fechaPago" className="block text-sm font-medium text-gray-700">
                Fecha del Cobro
              </label>
              <input
                type="datetime-local"
                id="fechaPago"
                name="fechaPago"
                value={newCobro.fechaPago}
                onChange={(e) => {
                  handleChange({ target: { name: 'fechaPago', value: e.target.value } });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            {/* Campos de pago */}
            <div className="space-y-4">
              {/* Campo para Yape */}
              <div className="mb-4">
                <label htmlFor="yape" className="block text-sm font-medium text-gray-700">
                  Yape
                </label>                <input
                  type="number"
                  name="yape"
                  id="yape"
                  placeholder="Monto transferido via Yape"
                  value={newCobro.yape || 0}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              {/* Campo para Efectivo */}
              <div className="mb-4">
                <label htmlFor="efectivo" className="block text-sm font-medium text-gray-700">
                  Efectivo
                </label>                <input
                  type="number"
                  name="efectivo"
                  id="efectivo"
                  placeholder="Monto en efectivo"
                  value={newCobro.efectivo || 0}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              {/* Campo para Gastos Imprevistos */}
              <div className="mb-4">
                <label htmlFor="gastosImprevistos" className="block text-sm font-medium text-gray-700">
                  Gastos Imprevistos
                </label>                <input
                  type="number"
                  name="gastosImprevistos"
                  id="gastosImprevistos"
                  placeholder="Gastos adicionales"
                  value={newCobro.gastosImprevistos || 0}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              
              {/* Total Pagado (calculado automáticamente) */}
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total a Pagar:</span>
                  <span className="text-lg font-bold text-gray-900">
                    S/ {newCobro.montoPagado.toFixed(2)}
                  </span>
                </div>
                  {/* Mostrar validación de monto */}
                {newCobro.ventaId && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600">Deuda pendiente:</span>
                      <span className="font-medium text-red-600">
                        S/ {colaboradores.find(v => v._id === newCobro.ventaId)?.deudaPendiente?.toFixed(2)}
                      </span>
                    </div>
                    {newCobro.montoPagado > 0 && (
                      <div className="flex justify-between items-center text-xs mt-1">
                        <span className="text-gray-600">Restante después del pago:</span>
                        <span className={`font-medium ${
                          (colaboradores.find(v => v._id === newCobro.ventaId)?.deudaPendiente - newCobro.montoPagado) >= 0 
                            ? 'text-orange-600' 
                            : 'text-red-600'
                        }`}>
                          S/ {Math.max(0, (colaboradores.find(v => v._id === newCobro.ventaId)?.deudaPendiente || 0) - newCobro.montoPagado).toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    {/* Alerta si excede la deuda */}
                    {newCobro.montoPagado > (colaboradores.find(v => v._id === newCobro.ventaId)?.deudaPendiente || 0) && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-xs text-red-600 font-medium">
                          ⚠️ El monto excede la deuda pendiente de esta venta
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        {/* Botones de acción */}
        <div className="flex justify-end space-x-2 mt-6">
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
            onClick={toggleFormVisibility}
          >
            Cancelar
          </button>          <button
            className={`px-4 py-2 rounded-md text-white transition-colors duration-200 
              ${newCobro.ventaId && newCobro.montoPagado > 0 && !isSubmittingCobro
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-gray-400 cursor-not-allowed'}`}
            onClick={handleAddCobro}
            disabled={!newCobro.ventaId || newCobro.montoPagado <= 0 || isSubmittingCobro}
          >
            {isSubmittingCobro ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </div>
            ) : (
              'Agregar Cobro'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CobroModal;
