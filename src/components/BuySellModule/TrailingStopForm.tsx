import React, { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { TrailingStopProps } from './types';

const TrailingStopForm: React.FC<TrailingStopProps> = ({
  qty,
  setQty,
  trailType,
  setTrailType,
  trailValue,
  setTrailValue,
  stopPrice,
  setStopPrice,
  price,
}) => {
  // Auto-calculate stop price when price or trailValue changes
  useEffect(() => {
    if (!price || !trailValue) return;

    const calculatedStop =
      trailType === 'rate'
        ? price - price * (trailValue / 100)
        : price - trailValue;

    setStopPrice(parseFloat(calculatedStop.toFixed(2)));
  }, [price, trailValue, trailType, setStopPrice]);

  return (
    <div className="space-y-4">
      <Label>Trail Type</Label>
      <div className="flex space-x-2">
        <Button
          variant={trailType === 'rate' ? 'default' : 'outline'}
          onClick={() => setTrailType('rate')}
        >
          Rate (%)
        </Button>
        <Button
          variant={trailType === 'price' ? 'default' : 'outline'}
          onClick={() => setTrailType('price')}
        >
          Price ($)
        </Button>
      </div>

      <Label>{trailType === 'rate' ? 'Trail Rate (%)' : 'Trail Price ($)'}</Label>
      <Input
        type="number"
        step="0.01"
        min="0"
        value={trailValue ?? ''}
        onChange={(e) => setTrailValue(parseFloat(e.target.value) || null)}
        placeholder={trailType === 'rate' ? 'e.g. 2.5' : 'e.g. 1.00'}
      />

      <Label>Auto-Calculated Stop Price</Label>
      <Input
        type="number"
        value={stopPrice ?? ''}
        disabled
        readOnly
        className="bg-gray-800 text-white"
      />

      <Label>Quantity</Label>
      <Input
        type="number"
        min="0"
        value={qty || ''}
        onChange={(e) => setQty(parseInt(e.target.value, 10) || 0)}
        placeholder="e.g. 20"
      />
    </div>
  );
};

export default TrailingStopForm;
