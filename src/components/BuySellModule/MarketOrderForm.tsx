import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { QuantityProps } from './types';

interface MarketOrderFormProps extends QuantityProps {}

const MarketOrderForm: React.FC<MarketOrderFormProps> = ({ qty, setQty }) => {
  const [mode, setMode] = useState<'shares' | 'dollars'>('shares');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      setQty(mode === 'shares' ? Math.floor(val) : val);
    } else {
      setQty(0);
    }
  };

  return (
    <div className="space-y-4">
      <Label>Trade Mode</Label>
      <div className="flex space-x-2">
        <Button
          variant="ghost"
          className={mode === 'shares' ? 'border border-white font-bold' : ''}
          onClick={() => setMode('shares')}
        >
          Shares
        </Button>
        <Button
          variant="ghost"
          className={mode === 'dollars' ? 'border border-white font-bold' : ''}
          onClick={() => setMode('dollars')}
        >
          Dollars
        </Button>
      </div>

      <Label>{mode === 'shares' ? 'Quantity' : 'Amount ($)'}</Label>
      <Input
        type="number"
        min="0"
        value={qty || ''}
        onChange={handleChange}
        placeholder={mode === 'shares' ? 'e.g. 10' : 'e.g. 100.00'}
        className="bg-black text-white"
      />
    </div>
  );
};

export default MarketOrderForm;
