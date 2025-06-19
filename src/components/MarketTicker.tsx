import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import MarketChart from './MarketChart';

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

const MarketTicker: React.FC = () => {
  const [stocks, setStocks] = useState<StockData[]>([
    { symbol: 'AAPL', price: 175.43, change: 2.15, changePercent: 1.24 },
    { symbol: 'TSLA', price: 248.87, change: -5.32, changePercent: -2.09 },
    { symbol: 'MSFT', price: 378.91, change: 1.87, changePercent: 0.49 },
    { symbol: 'GOOGL', price: 142.56, change: 0.78, changePercent: 0.55 },
    { symbol: 'AMZN', price: 151.23, change: -1.45, changePercent: -0.95 }
  ]);
  
  const [chartType, setChartType] = useState<'candlestick' | 'line' | 'mountain'>('candlestick');
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');

  useEffect(() => {
    const interval = setInterval(() => {
      setStocks(prev => prev.map(stock => ({
        ...stock,
        price: stock.price + (Math.random() - 0.5) * 2,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 5
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span>Live Market Ticker</span>
          <div className="flex gap-2">
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
        <div className="space-y-3">
          {stocks.map((stock) => (
            <div 
              key={stock.symbol} 
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                selectedSymbol === stock.symbol ? 'bg-blue-800' : 'bg-gray-800 hover:bg-gray-700'
              }`}
              onClick={() => setSelectedSymbol(stock.symbol)}
            >
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-600">{stock.symbol}</Badge>
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
        
        <MarketChart chartType={chartType} symbol={selectedSymbol} />
      </CardContent>
    </Card>
  );
};

export default MarketTicker;