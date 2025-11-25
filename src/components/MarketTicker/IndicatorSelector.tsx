// src/components/MarketTicker/IndicatorSelector.tsx
import React from 'react';
import type { IndicatorName } from '@/store/MarketStore';
import { Button } from '@/components/ui/button';

type Preset =
  | 'Trend Trader'
  | 'Momentum Reversal'
  | 'Volatility Breakout'
  | 'Institutional Flow'
  | 'Swing Setup';

interface Props {
  /** Array of active indicator names */
  indicators: IndicatorName[];
  /** Called when indicator selection changes */
  onChange: (list: IndicatorName[]) => void;
  /** Enables multi-select mode (default true) */
  multiSelect?: boolean;
  /** Optional className for layout customization */
  className?: string;
}

const GROUPS: Record<string, IndicatorName[]> = {
  Trend: ['sma', 'ema', 'vwap', 'supertrend', 'parabolic', 'adx'],
  Momentum: ['macd', 'rsi', 'stochastic'],
  Volatility: ['bollinger', 'atr', 'supertrend'],
  Volume: ['volume'],
};

const PRESETS: Record<Preset, IndicatorName[]> = {
  'Trend Trader': ['ema', 'macd', 'adx', 'volume'],
  'Momentum Reversal': ['rsi', 'stochastic', 'macd', 'volume'],
  'Volatility Breakout': ['bollinger', 'atr', 'supertrend', 'volume'],
  'Institutional Flow': ['vwap', 'volume', 'ema'],
  'Swing Setup': ['sma', 'rsi', 'macd', 'bollinger', 'volume'],
};

/**
 * IndicatorSelector
 * Multi-select UI for toggling multiple technical indicators
 * and applying predefined presets.
 */
const IndicatorSelector: React.FC<Props> = ({
  indicators,
  onChange,
  multiSelect = true,
  className,
}) => {
  /** Toggle handler for an individual indicator */
  const handleToggle = (name: IndicatorName) => {
    if (multiSelect) {
      const next = indicators.includes(name)
        ? indicators.filter(i => i !== name)
        : [...indicators, name];
      onChange(next);
    } else {
      onChange([name]);
    }
  };

  /** Apply a preset (replace all selections) */
  const handlePreset = (preset: Preset) => {
    const list = PRESETS[preset];
    if (!list) return;
    onChange(list);
  };

  return (
    <div
      className={`flex flex-col gap-2 items-start text-gray-300 ${className ?? ''}`}
    >
      {/* Presets Section */}
      <div className="flex flex-wrap gap-1">
        {Object.keys(PRESETS).map(preset => (
          <Button
            key={preset}
            size="sm"
            variant="outline"
            onClick={() => handlePreset(preset as Preset)}
            className="text-xs"
          >
            {preset}
          </Button>
        ))}
      </div>

      {/* Indicator Groups */}
      <div className="flex flex-wrap gap-3 items-start">
        {Object.entries(GROUPS).map(([group, list]) => (
          <div key={group} className="flex flex-col items-start gap-1">
            <div className="text-xs text-gray-400 font-semibold">{group}</div>
            <div className="flex flex-wrap gap-1">
              {list.map(name => {
                const active = indicators.includes(name);
                return (
                  <Button
                    key={name}
                    size="sm"
                    variant={active ? 'default' : 'outline'}
                    onClick={() => handleToggle(name)}
                    className={`text-xs capitalize ${
                      active ? 'bg-blue-600 text-white' : 'text-gray-300'
                    }`}
                  >
                    {String(name)}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IndicatorSelector;
