import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { QuantityProps, StopPriceProps, LimitPriceProps } from './types';

interface StopLimitOrderFormProps extends QuantityProps, StopPriceProps, LimitPriceProps {}

const StopLimitOrderForm: React.FC<StopLimitOrderFormProps> = ({
  qty,
  setQty,
  stopPrice,
  setStopPrice,
  limitPrice,
  setLimitPrice,
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
          placeholder="e.g. 75"
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
          placeholder="e.g. 90.00"
        />
      </div>

      <div>
        <Label>Limit Price ($)</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={limitPrice ?? ''}
          onChange={(e) => setLimitPrice(parseFloat(e.target.value) || null)}
          placeholder="e.g. 89.50"
        />
      </div>
    </div>
  );
};

export default StopLimitOrderForm;
