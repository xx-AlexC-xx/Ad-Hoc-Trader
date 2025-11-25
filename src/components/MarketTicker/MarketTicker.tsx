import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { Rnd } from 'react-rnd';
import { ExternalLink, Settings, X } from 'lucide-react';
import {
  useMarketStore,
  IndicatorName,
} from '@/store/MarketStore';
import { useAppContext } from '@/contexts/AppContext';
import type { ChartType } from '@/types/MarketData';
import MarketChart from './MarketChart';
import MarketSelectors from './MarketSelectors';
import ConnectionBanner from './ConnectionBanner';

type MarketTickerProps = {
  showSymbolsListOnly?: boolean;
};


const MarketTicker: React.FC<MarketTickerProps> = ({ showSymbolsListOnly }) => {
  const selectedSymbol = useMarketStore((s) => s.selectedSymbol);
  const setSelectedSymbol = useMarketStore((s) => s.setSelectedSymbol);
  const addSymbol = useMarketStore((s) => s.addSymbolToWatchList);
  const removeSymbol = useMarketStore((s) => s.removeSymbolFromWatchList);
  const watchedSymbols = useMarketStore((s) => s.watchedSymbols) ?? [];

  const candles = useMarketStore((s) => s.candles) ?? [];
  const chartTypes = useMarketStore((s) => s.chartTypes) ?? [];
  const setChartTypes = useMarketStore((s) => s.setChartTypes);

  const indicatorsObject = useMarketStore((s) => s.indicators) ?? {};
  const setIndicators = useMarketStore((s) => s.setIndicators);

  const volatility = useMarketStore((s: any) => s.volatility) ?? [];
  const setVolatility = useMarketStore((s: any) => s.setVolatility);

  const combinations = useMarketStore((s: any) => s.combinations) ?? [];
  const setCombinations = useMarketStore((s: any) => s.setCombinations);

  const isPoppedOut = useMarketStore((s: any) => s.isPoppedOut);
  const setPoppedOut = useMarketStore((s: any) => s.setPoppedOut);
  const clearChart = useMarketStore((s: any) => s.clearChart);

  const { user } = useAppContext();
  const userId = user?.id;

  const activeIndicators = Object.keys(indicatorsObject).filter(
    (k) => indicatorsObject[k].enabled
  ) as IndicatorName[];

  const [symbolInput, setSymbolInput] = useState('');
  const popupRef = useRef<Window | null>(null);
  const rootRef = useRef<any>(null);

  useEffect(() => {
    const sel = useMarketStore.getState().selectedSymbol;
    if (sel && userId) {
      useMarketStore
        .getState()
        .loadHistoricalData(sel, userId)
        .catch(() => {});
    }
  }, [userId, selectedSymbol]);

  const handleSymbolAdd = () => {
    const trimmed = symbolInput.trim().toUpperCase();
    if (trimmed) {
      console.log('[MarketTicker] Adding symbol:', trimmed);
      addSymbol(trimmed);
      setSymbolInput('');
    }
  };

  const handleSymbolClick = (symbol: string) => {
    console.log('[MarketTicker] Symbol clicked:', symbol);
    setSelectedSymbol(symbol, userId);
    if (userId) {
      useMarketStore.getState().loadHistoricalData(symbol, userId);
    }
  };

  const handleRemoveSymbol = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('[MarketTicker] Removing symbol:', symbol);
    removeSymbol(symbol);
  };

  const openPopout = () => {
    if (isPoppedOut) return;
    const w = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=800');
    if (!w) return;
    popupRef.current = w;
    setPoppedOut(true);

    w.document.open();
    w.document.write(`<!doctype html>
      <html>
        <head>
          <title>Market Ticker — Popout</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>body{margin:0;background:#071023;color:#fff;font-family:sans-serif} #root{height:100vh}</style>
        </head>
        <body>
          <div id="root"></div>
        </body>
      </html>`);
    w.document.close();

    setTimeout(() => {
      try {
        import('react-dom/client').then((ReactDOMClient) => {
          const rootEl = w.document.getElementById('root') as HTMLElement;
          if (!rootEl) return;
          rootRef.current = ReactDOMClient.createRoot(rootEl);
          rootRef.current.render(
            React.createElement(() => (
              <div
                style={{
                  height: '100vh',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ fontWeight: 700 }}>Market Ticker — Popout</div>
                    <ConnectionBanner />
                  </div>
                  <div>
                    <button
                      onClick={() => {
                        try {
                          w.close();
                        } catch {}
                      }}
                      style={{
                        background: 'transparent',
                        color: '#cbd5e1',
                        border: '1px solid #374151',
                        padding: '6px 10px',
                        borderRadius: 6,
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div>
                  <MarketSelectors />
                </div>

                <div style={{ flex: 1, overflow: 'auto' }}>
                  <MarketChart
                    symbol={useMarketStore.getState().selectedSymbol ?? undefined}
                    chartTypes={useMarketStore.getState().chartTypes as ChartType[]}
                    indicators={useMarketStore.getState().activeIndicators as IndicatorName[]}
                    volatility={useMarketStore.getState().volatility ?? []}
                    combinations={useMarketStore.getState().combinations ?? []}
                    height={Math.max(300, Math.floor(window.innerHeight - 240))}
                  />
                </div>
              </div>
            ))
          );
        });
      } catch (err) {
        console.error('Popout render error', err);
      }
    }, 50);

    const onUnload = () => {
      setPoppedOut(false);
      try {
        if (rootRef.current) rootRef.current.unmount();
      } catch {}
      popupRef.current = null;
    };
    w.addEventListener('beforeunload', onUnload);
  };

  if (isPoppedOut) return null;

  const currentChartTypes = Array.isArray(chartTypes)
    ? (chartTypes as ChartType[])
    : (['candlestick'] as ChartType[]);
  const currentIndicators = activeIndicators;

  return (
    <Rnd
      default={{ x: 0, y: 0, width: 1500, height: 1000 }}
      minWidth={800}
      minHeight={500}
      bounds="window"
      enableResizing={{
        top: false,
        right: true,
        bottom: true,
        bottomRight: true,
      }}
      dragHandleClassName="drag-handle"
      className="flex justify-center items-start p-2"
    >
      <Card className="bg-gray-900 border-gray-700 overflow-visible w-full h-full max-w-[1800px] mx-auto text-white">
        <CardHeader className="relative overflow-visible z-[50] drag-handle cursor-move">
          <CardTitle className="text-white flex items-center justify-between mb-2 overflow-visible">
            <div className="flex items-center gap-3">
              <span>Live Market Ticker</span>
              <ConnectionBanner />
            </div>

            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={openPopout}>
                    <ExternalLink className="w-4 h-4 text-gray-300" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <div>Pop out to new window</div>
                </TooltipContent>
              </Tooltip>

              <Button size="sm" variant="secondary" onClick={() => clearChart(true)}>
                Clear Chart
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="h-full overflow-auto">
          <div className="grid grid-cols-12 gap-4 items-start h-full">
            <div className="col-span-4 bg-gray-800 rounded-md p-3 flex flex-col h-full">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-gray-300">Battery Box</h3>
              </div>

              <Input
                placeholder="Add Symbol"
                className="mb-2 text-sm"
                value={symbolInput}
                onChange={(e) => {
                  console.log('[MarketTicker] Input changed:', e.target.value);
                  setSymbolInput(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSymbolAdd();
                  }
                }}
              />
              <Button size="sm" onClick={handleSymbolAdd} className="mb-3">
                Add
              </Button>

              {watchedSymbols.length > 0 ? (
                <div className="text-sm text-teal-400 flex-1 overflow-auto space-y-1">
                  {watchedSymbols.map((symbol: string) => (
                    <div
                      key={symbol}
                      className="flex items-center justify-between hover:bg-gray-700 px-2 py-1 rounded cursor-pointer"
                      onClick={() => handleSymbolClick(symbol)}
                    >
                      <span>{symbol}</span>
                      <X
                        className="w-4 h-4 text-red-500 hover:text-red-700"
                        onClick={(e) => handleRemoveSymbol(symbol, e)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-xs italic">
                  No symbols added. Choose a symbol to render chart.
                </div>
              )}
            </div>

            <div className="col-span-6 space-y-6 h-full">
              <div className="bg-gray-850 rounded-md p-3 h-full">
                <MarketChart
                  symbol={selectedSymbol ?? undefined}
                  chartTypes={currentChartTypes}
                  indicators={currentIndicators}
                  volatility={volatility}
                  combinations={combinations}
                  height={520}
                />
              </div>
            </div>

            <div className="col-span-2 flex flex-col gap-4 w-full">
              <MarketSelectors />
            </div>
          </div>
        </CardContent>
      </Card>
    </Rnd>
  );
};

export default MarketTicker;
