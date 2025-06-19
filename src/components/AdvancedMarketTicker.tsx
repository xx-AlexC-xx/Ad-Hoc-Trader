import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import EnhancedChartRenderer from './EnhancedChartRenderer';
import SymbolInput from './SymbolInput';

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface ChartPoint {
  time: string;
  date: string;
  price: number;
  volume: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

type ChartType = 'mountain' | 'line' | 'ohlc' | 'candlestick' | 'advanced';
type IndicatorType = 'volume' | 'ma' | 'momentum' | 'macd' | 'stochastics' | 'rsi' | 'bollinger' | 'supertrend' | 'atr';

const AdvancedMarketTicker: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [selectedIndicators, setSelectedIndicators] = useState<IndicatorType[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const stocks: StockData[] = [
    { symbol: 'AAPL', price: 175.43, change: 2.15, changePercent: 1.24, volume: 45000000, open: 173.28, high: 176.80, low: 172.95, close: 175.43 },
    { symbol: 'TSLA', price: 248.87, change: -5.32, changePercent: -2.09, volume: 32000000, open: 254.19, high: 255.50, low: 247.20, close: 248.87 },
    { symbol: 'MSFT', price: 378.91, change: 1.87, changePercent: 0.49, volume: 28000000, open: 377.04, high: 380.25, low: 376.80, close: 378.91 },
    { symbol: 'GOOGL', price: 142.56, change: 0.78, changePercent: 0.55, volume: 25000000, open: 141.78, high: 143.20, low: 141.50, close: 142.56 }
  ];

  const generateChartData = (): ChartPoint[] => {
    const data: ChartPoint[] = [];
    const basePrice = stocks.find(s => s.symbol === selectedSymbol)?.price || 100;
    let currentPrice = basePrice;
    
    for (let i = 0; i < 50; i++) {
      const date = new Date();
      date.setHours(date.getHours() - (49 - i));
      
      const open = currentPrice;
      const change = (Math.random() - 0.5) * 8;
      const high = open + Math.random() * 3;
      const low = open - Math.random() * 3;
      const close = open + change;
      currentPrice = close;
      
      data.push({
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        date: date.toLocaleDateString(),
        price: close,
        volume: Math.floor(Math.random() * 2000000) + 500000,
        open: Math.max(10, open),
        high: Math.max(10, high),
        low: Math.max(10, low),
        close: Math.max(10, close)
      });
    }
    return data;
  };

  const [chartData, setChartData] = useState<ChartPoint[]>(generateChartData());
  
  useEffect(() => {
    setChartData(generateChartData());
  }, [selectedSymbol]);

  const currentStock = stocks.find(s => s.symbol === selectedSymbol) || {
    symbol: selectedSymbol,
    price: 100,
    change: 0,
    changePercent: 0,
    volume: 1000000,
    open: 100,
    high: 105,
    low: 95,
    close: 100
  };
  
  const maxPrice = Math.max(...chartData.map(d => Math.max(d.high, d.price)));
  const minPrice = Math.min(...chartData.map(d => Math.min(d.low, d.price)));
  const priceRange = maxPrice - minPrice || 1;

  const handleMouseMove = (event: React.MouseEvent<SVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const chartWidth = rect.width - 120;
    const dataIndex = Math.floor((x - 60) / (chartWidth / (chartData.length - 1)));
    
    if (dataIndex >= 0 && dataIndex < chartData.length) {
      setHoveredPoint(chartData[dataIndex]);
      setMousePosition({ x: event.clientX, y: event.clientY });
    }
  };

  const toggleIndicator = (indicator: IndicatorType) => {
    setSelectedIndicators(prev => 
      prev.includes(indicator) 
        ? prev.filter(i => i !== indicator)
        : [...prev, indicator]
    );
  };

  return (
    <div className="w-full h-screen bg-black text-white overflow-hidden">
      <Card className="bg-black border-gray-700 h-full">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="text-white text-xl">
              Live Market Ticker - {selectedSymbol}
            </CardTitle>
            
            <div className="flex flex-wrap gap-2">
              <SymbolInput
                value={selectedSymbol}
                onChange={setSelectedSymbol}
              />

              <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
                <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="mountain" className="text-white hover:bg-gray-700">Mountain</SelectItem>
                  <SelectItem value="line" className="text-white hover:bg-gray-700">Line</SelectItem>
                  <SelectItem value="ohlc" className="text-white hover:bg-gray-700">OHLC</SelectItem>
                  <SelectItem value="candlestick" className="text-white hover:bg-gray-700">Candlestick</SelectItem>
                  <SelectItem value="advanced" className="text-white hover:bg-gray-700">Advanced</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={(value: IndicatorType) => toggleIndicator(value)}>
                <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-white text-sm">
                  <SelectValue placeholder="Indicators" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="volume" className="text-white hover:bg-gray-700">Volume</SelectItem>
                  <SelectItem value="ma" className="text-white hover:bg-gray-700">Moving Average</SelectItem>
                  <SelectItem value="momentum" className="text-white hover:bg-gray-700">Momentum</SelectItem>
                  <SelectItem value="macd" className="text-white hover:bg-gray-700">MACD</SelectItem>
                  <SelectItem value="stochastics" className="text-white hover:bg-gray-700">Stochastics</SelectItem>
                  <SelectItem value="rsi" className="text-white hover:bg-gray-700">RSI</SelectItem>
                  <SelectItem value="bollinger" className="text-white hover:bg-gray-700">Bollinger Bands</SelectItem>
                  <SelectItem value="supertrend" className="text-white hover:bg-gray-700">Supertrend</SelectItem>
                  <SelectItem value="atr" className="text-white hover:bg-gray-700">Average True R</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {selectedIndicators.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedIndicators.map(indicator => (
                <Badge 
                  key={indicator} 
                  className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  onClick={() => toggleIndicator(indicator)}
                >
                  {indicator.toUpperCase()} ×
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-0 flex-1 h-full">
          <div className="grid grid-cols-12 h-full">
            <div className="col-span-2 bg-gray-900 p-4 border-r border-gray-700">
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-white">${currentStock.price.toFixed(2)}</div>
                  <div className={`text-lg font-semibold ${
                    currentStock.change >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {currentStock.change >= 0 ? '+' : ''}{currentStock.change.toFixed(2)}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-300">
                  <div>Open: ${currentStock.open.toFixed(2)}</div>
                  <div>High: ${currentStock.high.toFixed(2)}</div>
                  <div>Low: ${currentStock.low.toFixed(2)}</div>
                  <div>Volume: {(currentStock.volume / 1000000).toFixed(1)}M</div>
                </div>
              </div>
            </div>

            <div className="col-span-8 bg-black p-4 h-full">
              <div className="w-full h-full">
                <EnhancedChartRenderer
                  chartData={chartData}
                  chartType={chartType}
                  indicators={selectedIndicators}
                  maxPrice={maxPrice}
                  minPrice={minPrice}
                  priceRange={priceRange}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                
                {hoveredPoint && (
                  <div 
                    className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg p-3 text-white text-sm shadow-lg pointer-events-none"
                    style={{
                      left: mousePosition.x + 10,
                      top: mousePosition.y - 10
                    }}
                  >
                    <div className="font-semibold">{hoveredPoint.date} {hoveredPoint.time}</div>
                    <div>Open: ${hoveredPoint.open.toFixed(2)}</div>
                    <div>High: ${hoveredPoint.high.toFixed(2)}</div>
                    <div>Low: ${hoveredPoint.low.toFixed(2)}</div>
                    <div>Close: ${hoveredPoint.close.toFixed(2)}</div>
                    <div>Volume: {(hoveredPoint.volume / 1000000).toFixed(1)}M</div>
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-2 bg-gray-900 p-4 border-l border-gray-700">
              <div className="space-y-4">
                <div className="text-center">
                  <Badge className={`${
                    currentStock.changePercent >= 0 ? 'bg-green-600' : 'bg-red-600'
                  } text-lg px-3 py-1`}>
                    {currentStock.changePercent >= 0 ? '+' : ''}{currentStock.changePercent.toFixed(2)}%
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="text-center font-semibold text-white">Market Stats</div>
                  <div>Prev Close: ${(currentStock.price - currentStock.change).toFixed(2)}</div>
                  <div>Day Range: ${currentStock.low.toFixed(2)} - ${currentStock.high.toFixed(2)}</div>
                  <div>Avg Volume: {(currentStock.volume / 1000000 * 0.8).toFixed(1)}M</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedMarketTicker;