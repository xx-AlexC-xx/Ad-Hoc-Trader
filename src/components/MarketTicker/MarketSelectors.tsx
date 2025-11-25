// src/components/MarketTicker/MarketSelectors.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMarketStore } from '@/store/MarketStore';
import type { ChartType } from '@/types/MarketData';
import type { IndicatorName } from '@/store/MarketStore';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

/**
 * MarketSelectors
 * Four dropdowns using popovers + checkboxes (ShadCN style).
 * - Chart Type
 * - Indicators
 * - Volatility
 * - Combinations
  */

const CHART_OPTIONS = [
  'candlestick',
  'line',
  'bar',
  'ohlc',
  'mountain',
  'heikin-ashi',
] as unknown as ChartType[];

const INDICATOR_OPTIONS: IndicatorName[] = [
  'sma',
  'ema',
  'vwap',
  'parabolic',
  'adx',
  'macd',
  'rsi',
  'stochastic',
  'volume',
];

const VOLATILITY_OPTIONS = ['bollinger', 'atr', 'supertrend'] as const;

const COMBINATIONS = [
  'Trend Trader',
  'Momentum Reversal',
  'Volatility Breakout',
  'Institutional Flow',
  'Swing SetUp',
  'Mean Reversion',
  'Scalper',
] as const;

interface MultiSelectDropdownProps<T extends string> {
  label: string;
  placeholder: string;
  options: readonly T[];
  selected: readonly T[];
  onToggle: (value: T) => void;
  buttonClassName?: string;
  optionLabel?: (value: T) => string;
}

function MultiSelectDropdown<T extends string>({
  label,
  placeholder,
  options,
  selected,
  onToggle,
  buttonClassName,
  optionLabel,
}: MultiSelectDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });

  const updatePosition = useCallback(() => {
    if (typeof window === 'undefined' || !triggerRef.current) return;
    const doc = triggerRef.current.ownerDocument ?? document;
    const win = doc.defaultView ?? window;
    if (rafRef.current) {
      win.cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = win.requestAnimationFrame(() => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const nextPosition = {
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      };
      console.log('[MarketSelectors] updatePosition ->', label, nextPosition);
      setMenuPosition(nextPosition);
      setPortalRoot(doc.body);
    });
  }, [label]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const doc = triggerRef.current?.ownerDocument ?? document;
    return () => {
      if (rafRef.current) {
        win.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    console.log('[MarketSelectors] dropdown opened ->', label);
    updatePosition();
    const doc = triggerRef.current?.ownerDocument ?? document;
    const win = doc.defaultView ?? window;

    const handlePointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      console.log('[MarketSelectors] outside click closing ->', label);
      setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        console.log('[MarketSelectors] escape closing ->', label);
        setOpen(false);
      }
    };
    doc.addEventListener('mousedown', handlePointer);
    doc.addEventListener('touchstart', handlePointer, { passive: true });
    doc.addEventListener('keydown', handleKey);
    return () => {
      doc.removeEventListener('mousedown', handlePointer);
      doc.removeEventListener('touchstart', handlePointer);
      doc.removeEventListener('keydown', handleKey);
    };
  }, [label, open, updatePosition]);

  const displayValue = useMemo(() => {
    if (selected.length === 0) return placeholder;
    const labels = selected.map((value) =>
      optionLabel ? optionLabel(value) : value
    );
    if (labels.length <= 2) return labels.join(', ');
    return `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`;
  }, [selected, placeholder, optionLabel]);

  return (
    <div ref={containerRef} className="relative w-full">
      <Label className="mb-1 block text-xs text-gray-400">{label}</Label>
      <Button
        type="button"
        ref={triggerRef}
        variant="outline"
        size="sm"
        className={cn(
          'flex w-full items-center justify-between gap-3 rounded-md border border-gray-600 bg-gray-900 text-left text-sm text-gray-100 hover:border-gray-400 focus-visible:ring-2 focus-visible:ring-teal-500',
          buttonClassName
        )}
        onClick={() =>
          setOpen((prev) => {
            const next = !prev;
            console.log('[MarketSelectors] toggle dropdown ->', label, next ? 'open' : 'closed');
            return next;
          })
        }
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{displayValue}</span>
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
        />
      </Button>

      {open &&
        portalRoot &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            className="fixed z-[9999] max-h-60 overflow-y-auto rounded-md border border-gray-700 bg-gray-900 p-2 shadow-2xl"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
            }}
          >
            {options.map((option) => {
              const labelText = optionLabel ? optionLabel(option) : option;
              return (
                <label
                  key={option}
                  className="flex items-center gap-2 rounded px-2 py-1 text-sm text-gray-200 hover:bg-gray-800"
                >
                  <Checkbox
                    checked={selected.includes(option)}
                    onCheckedChange={() => {
                      console.log('[MarketSelectors] option toggled ->', label, option);
                      onToggle(option);
                    }}
                  />
                  <span>{labelText}</span>
                </label>
              );
            })}
          </div>,
          portalRoot
        )}
    </div>
  );
}

export default function MarketSelectors() {
  const chartTypes = useMarketStore((s) => s.chartTypes) ?? ([] as ChartType[]);
  const setChartTypes = useMarketStore((s) => s.setChartTypes);

  const indicatorsObj = useMarketStore((s) => s.indicators);
  const activeIndicators = useMemo(
    () => Object.keys(indicatorsObj).filter((k) => indicatorsObj[k].enabled) as IndicatorName[],
    [indicatorsObj]
  );
  const setIndicators = useMarketStore((s) => s.setIndicators);

  const volatility = useMarketStore((s: any) => s.volatility ?? ([] as string[]));
  const setVolatility = useMarketStore((s: any) => s.setVolatility);

  const combinations = useMarketStore((s: any) => s.combinations ?? ([] as string[]));
  const setCombinations = useMarketStore((s: any) => s.setCombinations);

  const broadcast = (payload: any) => {
    try {
      console.log('[MarketSelectors] broadcast payload ->', payload);
      if (typeof window !== 'undefined' && (window as any).BroadcastChannel) {
        const bc = new (window as any).BroadcastChannel('market-ticker');
        bc.postMessage({ sender: 'selectors', type: 'state-update', payload });
        bc.close();
      }
    } catch {}
  };

  const toggleChartType = (type: ChartType) => {
    const next = chartTypes.includes(type)
      ? chartTypes.filter((t) => t !== type)
      : [...chartTypes, type];
    console.log('[MarketSelectors] toggleChartType ->', type, next);
    setChartTypes(next);
    broadcast({ chartTypes: next });
  };

  const toggleIndicator = (name: IndicatorName) => {
    const next = activeIndicators.includes(name)
      ? activeIndicators.filter((i) => i !== name)
      : [...activeIndicators, name];
    console.log('[MarketSelectors] toggleIndicator ->', name, next);
    setIndicators(next);
    broadcast({ activeIndicators: next });
  };

  const toggleVolatility = (v: string) => {
    const next = volatility.includes(v)
      ? volatility.filter((x) => x !== v)
      : [...volatility, v];
    console.log('[MarketSelectors] toggleVolatility ->', v, next);
    setVolatility(next);
    broadcast({ volatility: next });
  };

  const toggleCombination = (c: string) => {
    const next = combinations.includes(c)
      ? combinations.filter((x) => x !== c)
      : [...combinations, c];
    console.log('[MarketSelectors] toggleCombination ->', c, next);
    setCombinations(next);
    broadcast({ combinations: next });
  };

  return (
    <div className="flex flex-col gap-4">
      <MultiSelectDropdown
        label="Chart Type"
        placeholder="Chart Type"
        options={CHART_OPTIONS}
        selected={chartTypes}
        onToggle={toggleChartType}
        buttonClassName="min-w-[160px]"
        optionLabel={(val) => String(val).replace('-', ' ')}
      />

      <MultiSelectDropdown
        label="Indicators"
        placeholder="Indicators"
        options={INDICATOR_OPTIONS}
        selected={activeIndicators}
        onToggle={toggleIndicator}
        buttonClassName="min-w-[220px]"
        optionLabel={(val) => val.toUpperCase()}
      />

      <MultiSelectDropdown
        label="Volatility"
        placeholder="Volatility"
        options={VOLATILITY_OPTIONS}
        selected={volatility}
        onToggle={toggleVolatility}
        buttonClassName="min-w-[180px]"
        optionLabel={(val) => val.toUpperCase()}
      />

      <MultiSelectDropdown
        label="Combinations"
        placeholder="Combinations"
        options={COMBINATIONS}
        selected={combinations}
        onToggle={toggleCombination}
        buttonClassName="min-w-[200px]"
      />
    </div>
  );
}
