import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { QuantityProps, LimitPriceProps } from './types';

interface LimitOrderFormProps extends QuantityProps, LimitPriceProps {}

const LimitOrderForm: React.FC<LimitOrderFormProps> = ({
  qty,
  setQty,
  limitPrice,
  setLimitPrice,
}) => {
  const [inputMode, setInputMode] = useState<'shares' | 'dollars'>('shares');

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Button
          variant="ghost"
          className={inputMode === 'shares' ? 'border border-white font-bold' : ''}
          onClick={() => setInputMode('shares')}
        >
          Shares
        </Button>
        <Button
          variant="ghost"
          className={inputMode === 'dollars' ? 'border border-white font-bold' : ''}
          onClick={() => setInputMode('dollars')}
        >
          Dollars
        </Button>
      </div>

      {inputMode === 'shares' && (
        <div>
          <Label>Quantity</Label>
          <Input
            type="number"
            min="0"
            value={qty || ''}
            onChange={(e) => setQty(parseInt(e.target.value, 10) || 0)}
            placeholder="e.g. 100"
            className="bg-black text-white"
          />
        </div>
      )}

      {inputMode === 'dollars' && (
        <div>
          <Label>Total Amount ($)</Label>
          <Input
            type="number"
            min="0"
            value={qty || ''}
            onChange={(e) => setQty(parseInt(e.target.value, 10) || 0)}
            placeholder="e.g. 1000"
            className="bg-black text-white"
          />
        </div>
      )}

      <div>
        <Label>Limit Price ($)</Label>
        <Input
          type="number"
          min="0"
          step="0.01"
          value={limitPrice ?? ''}
          onChange={(e) => setLimitPrice(parseFloat(e.target.value) || null)}
          placeholder="e.g. 95.50"
          className="bg-black text-white"
        />
      </div>
    </div>
  );
};

export default LimitOrderForm;
