// src/components/MarketTicker/ChartTypeSelector.tsx
import React from 'react';
import type { ChartType } from '@/types/MarketData';
import { Button } from '@/components/ui/button';

interface Props {
  /** Array of selected chart types (supports multi-select) */
  chartTypes: ChartType[];
  /** Called when chart type list changes */
  onChange: (types: ChartType[]) => void;
  /** Optional CSS classes for layout customization */
  className?: string;
  /** Enables or disables multi-select mode (default true) */
  multiSelect?: boolean;
}

const CHARTS: ChartType[] = [
  'candlestick',
  'ohlc',
  'line',
  'mountain',
  'heikin-ashi',
];

/**
 * ChartTypeSelector
 * A multi-select group of buttons allowing users to toggle one or more chart types.
 */
const ChartTypeSelector: React.FC<Props> = ({
  chartTypes,
  onChange,
  className,
  multiSelect = true,
}) => {
  /** Toggle handler for selecting/unselecting chart types */
  const handleToggle = (type: ChartType) => {
    if (multiSelect) {
      const next =
        chartTypes.includes(type)
          ? chartTypes.filter(t => t !== type)
          : [...chartTypes, type];
      onChange(next);
    } else {
      onChange([type]);
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className ?? ''}`}>
      {CHARTS.map(c => {
        const active = chartTypes.includes(c);
        return (
          <Button
            key={c}
            size="sm"
            variant={active ? 'default' : 'outline'}
            onClick={() => handleToggle(c)}
            className={`text-xs capitalize ${
              active ? 'bg-blue-600 text-white' : 'text-gray-300'
            }`}
          >
            {c.replace('-', ' ')}
          </Button>
        );
      })}
    </div>
  );
};

export default ChartTypeSelector;
