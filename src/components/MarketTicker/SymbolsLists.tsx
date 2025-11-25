// src/components/MarketTicker/SymbolList.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useMarketStore } from '@/store/MarketStore';

interface SymbolListProps {
  defaultSymbols?: string[];
  userId: string; // <-- Added userId prop for store methods
}

const SymbolList: React.FC<SymbolListProps> = ({
  defaultSymbols = ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN'],
  userId,
}) => {
  const quotes = useMarketStore((s) => s.quotes);
  const selectedSymbol = useMarketStore((s) => s.selectedSymbol);
  const setSelectedSymbol = useMarketStore((s) => s.setSelectedSymbol);
  const subscribeSymbol = useMarketStore((s) => s.subscribeSymbol);

  // Subscribe initial default symbols
  React.useEffect(() => {
    for (const s of defaultSymbols) subscribeSymbol(s);
  }, [defaultSymbols, subscribeSymbol]);

  const symbols =
    Object.keys(quotes).length > 0 ? Object.keys(quotes) : defaultSymbols;

  return (
    <div className="space-y-2">
      {symbols.map((sym) => {
        const q = quotes[sym];
        const price = q?.price ?? 0;
        const change = q?.change ?? 0;
        const changePercent = q?.changePercent ?? 0;
        const selected = selectedSymbol === sym;

        return (
          <div
            key={sym}
            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
              selected ? 'bg-blue-800' : 'bg-gray-800 hover:bg-gray-700'
            }`}
            onClick={() => setSelectedSymbol(sym, userId)} // <-- Pass userId here
          >
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-600">{sym}</Badge>
              <span className="text-white font-semibold">
                ${price.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`font-semibold ${
                  change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {change >= 0 ? '+' : ''}
                {change.toFixed(2)}
              </span>
              <Badge
                className={`${
                  changePercent >= 0 ? 'bg-green-600' : 'bg-red-600'
                }`}
              >
                {changePercent >= 0 ? '+' : ''}
                {changePercent.toFixed(2)}%
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SymbolList;
