// src/components/CardStats.js
import React from 'react';

const CardStats = ({ title, value, color }) => {
  return (
    <div className={`bg-white shadow-md rounded-md p-4 ${color}`}>
      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};

export default CardStats;
