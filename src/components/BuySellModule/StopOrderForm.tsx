import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { QuantityProps, StopPriceProps } from './types';

interface StopOrderFormProps extends QuantityProps, StopPriceProps {}

const StopOrderForm: React.FC<StopOrderFormProps> = ({
  qty,
  setQty,
  stopPrice,
  setStopPrice,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Label>Quantity</Label>
        <Input
          type="number"
          min="0"
          value={qty || ''}
          onChange={(e) => setQty(parseInt(e.target.value, 10) || 0)}
          placeholder="e.g. 50"
        />
      </div>

      <div>
        <Label>Stop Price ($)</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={stopPrice ?? ''}
          onChange={(e) => setStopPrice(parseFloat(e.target.value) || null)}
          placeholder="e.g. 92.00"
        />
      </div>
    </div>
  );
};

export default StopOrderForm;
