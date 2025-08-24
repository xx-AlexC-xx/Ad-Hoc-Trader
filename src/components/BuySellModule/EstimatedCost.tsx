import React from 'react';
import type { EstimatedCostProps } from './types';

const EstimatedCost: React.FC<EstimatedCostProps> = ({ price, qty, side, label }) => {
  if (!price || !qty) return null;

  const total = price * qty;

  return (
    <div className="text-sm text-gray-300 mt-2">
      {label}: <span className="font-semibold text-white">${total.toFixed(2)}</span>
    </div>
  );
};

export default EstimatedCost;
