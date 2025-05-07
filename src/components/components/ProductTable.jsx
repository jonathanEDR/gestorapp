// src/components/ProductTable.js
import React from 'react';

const ProductTable = () => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full leading-normal">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="py-3 px-6 text-left font-bold uppercase">Imagen</th>
            <th className="py-3 px-6 text-left font-bold uppercase">Nombre</th>
            <th className="py-3 px-6 text-left font-bold uppercase">SKU</th>
            <th className="py-3 px-6 text-left font-bold uppercase">Stock</th>
            <th className="py-3 px-6 text-left font-bold uppercase">Precio</th>
            <th className="py-3 px-6 text-right font-bold uppercase">Acciones</th>
          </tr>
        </thead>
        <tbody className="text-gray-600">
          <tr>
            <td className="py-3 px-6"><img src="https://via.placeholder.com/40" alt="Producto 1" className="w-8 h-8 rounded" /></td>
            <td className="py-3 px-6">Producto Ejemplo 1</td>
            <td className="py-3 px-6">SKU001</td>
            <td className="py-3 px-6">150</td>
            <td className="py-3 px-6">$25.00</td>
            <td className="py-3 px-6 text-right">
              <button className="text-indigo-500 hover:text-indigo-700"><i className="fas fa-edit"></i></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
