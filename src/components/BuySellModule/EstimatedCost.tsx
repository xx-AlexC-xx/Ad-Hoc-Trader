import React from 'react';
import { EstimatedCostProps } from './types';
import { Label } from '@/components/ui/label';

const EstimatedCost: React.FC<EstimatedCostProps> = ({ price, qty, side, label }) => {
  const total = price !== null ? price * qty : null;

  return (
    <div className="flex flex-col">
      <Label>{label}</Label>
      <div className="text-lg font-medium">
        {total !== null ? `$${total.toFixed(2)}` : '—'}
      </div>
      <div className="text-sm text-gray-500">
        {side === 'buy' ? 'Buying' : 'Selling'} {qty} units
      </div>
    </div>
  );
};

export default EstimatedCost;
