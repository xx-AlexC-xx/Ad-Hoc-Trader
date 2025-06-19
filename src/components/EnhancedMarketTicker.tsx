import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EnhancedMarketChart from './EnhancedMarketChart';
import SymbolSelector from './SymbolSelector';

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

interface EnhancedMarketTickerProps {
  highPotentialSymbols: string[];
  latestTradeSymbol?: string;
}

const EnhancedMarketTicker: React.FC<EnhancedMarketTickerProps> = ({ 
  highPotentialSymbols, 
  latestTradeSymbol 
}) => {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [chartType, setChartType] = useState<'candlestick' | 'line' | 'mountain'>('candlestick');
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');

  // Auto-load latest trade symbol
  useEffect(() => {
    if (latestTradeSymbol && latestTradeSymbol !== selectedSymbol) {
      setSelectedSymbol(latestTradeSymbol);
    }
  }, [latestTradeSymbol]);

  const generateStockData = (symbols: string[]): StockData[] => {
    return symbols.map(symbol => ({
      symbol,
      price: 50 + Math.random() * 200,
      change: (Math.random() - 0.5) * 10,
      changePercent: (Math.random() - 0.5) * 5
    }));
  };

  useEffect(() => {
    const allSymbols = ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', ...highPotentialSymbols]
      .filter((symbol, index, arr) => arr.indexOf(symbol) === index)
      .slice(0, 10);
    
    setStocks(generateStockData(allSymbols));

    const interval = setInterval(() => {
      setStocks(prev => prev.map(stock => ({
        ...stock,
        price: Math.max(10, stock.price + (Math.random() - 0.5) * 2),
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 5
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, [highPotentialSymbols]);

  const handleLoadHighPotentialSymbols = () => {
    if (highPotentialSymbols.length > 0) {
      setSelectedSymbol(highPotentialSymbols[0]);
      const newStocks = generateStockData(highPotentialSymbols.slice(0, 10));
      setStocks(newStocks);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>📈 Live Market Tracker</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleLoadHighPotentialSymbols}
                className="bg-orange-600 hover:bg-orange-700 text-white"
                disabled={highPotentialSymbols.length === 0}
              >
                🔥 High Potential Trade Symbols
              </Button>
              {['candlestick', 'line', 'mountain'].map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant={chartType === type ? "default" : "outline"}
                  onClick={() => setChartType(type as any)}
                  className="text-xs capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Symbol Selector */}
            <div>
              <SymbolSelector
                selectedSymbol={selectedSymbol}
                onSymbolChange={setSelectedSymbol}
                highPotentialSymbols={highPotentialSymbols}
                onLoadHighPotentialSymbols={handleLoadHighPotentialSymbols}
              />
            </div>
            
            {/* Stock List */}
            <div className="lg:col-span-2">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {stocks.map((stock) => (
                  <div 
                    key={stock.symbol} 
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedSymbol === stock.symbol ? 'bg-blue-800' : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                    onClick={() => setSelectedSymbol(stock.symbol)}
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={`${
                        highPotentialSymbols.includes(stock.symbol) ? 'bg-orange-600' : 'bg-blue-600'
                      }`}>
                        {stock.symbol}
                        {highPotentialSymbols.includes(stock.symbol) && ' 🔥'}
                      </Badge>
                      <span className="text-white font-semibold">${stock.price.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${
                        stock.change >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                      </span>
                      <Badge className={`${
                        stock.changePercent >= 0 ? 'bg-green-600' : 'bg-red-600'
                      }`}>
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Enhanced Chart */}
      <EnhancedMarketChart chartType={chartType} symbol={selectedSymbol} />
    </div>
  );
};

export default EnhancedMarketTicker;