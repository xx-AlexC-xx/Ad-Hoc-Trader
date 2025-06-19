import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: string;
}

interface ChartPoint {
  time: string;
  price: number;
  volume: number;
}

const ImprovedMarketTicker: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const stocks: StockData[] = [
    { symbol: 'AAPL', price: 175.43, change: 2.15, changePercent: 1.24, volume: 45000000, marketCap: '2.8T' },
    { symbol: 'TSLA', price: 248.87, change: -5.32, changePercent: -2.09, volume: 32000000, marketCap: '789B' },
    { symbol: 'MSFT', price: 378.91, change: 1.87, changePercent: 0.49, volume: 28000000, marketCap: '2.9T' },
    { symbol: 'GOOGL', price: 142.56, change: 0.78, changePercent: 0.55, volume: 25000000, marketCap: '1.8T' },
    { symbol: 'AMZN', price: 151.23, change: -1.45, changePercent: -0.95, volume: 38000000, marketCap: '1.6T' }
  ];

  const generateChartData = (): ChartPoint[] => {
    const data: ChartPoint[] = [];
    const basePrice = stocks.find(s => s.symbol === selectedSymbol)?.price || 100;
    let currentPrice = basePrice;
    
    for (let i = 0; i < 24; i++) {
      const hour = new Date();
      hour.setHours(hour.getHours() - (23 - i));
      
      currentPrice += (Math.random() - 0.5) * 5;
      data.push({
        time: hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        price: Math.max(10, currentPrice),
        volume: Math.floor(Math.random() * 1000000) + 500000
      });
    }
    return data;
  };

  const [chartData, setChartData] = useState<ChartPoint[]>(generateChartData());
  
  useEffect(() => {
    setChartData(generateChartData());
  }, [selectedSymbol]);

  const currentStock = stocks.find(s => s.symbol === selectedSymbol)!;
  const maxPrice = Math.max(...chartData.map(d => d.price));
  const minPrice = Math.min(...chartData.map(d => d.price));
  const priceRange = maxPrice - minPrice;

  const handleMouseMove = (event: React.MouseEvent<SVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const dataIndex = Math.floor((x - 40) / ((rect.width - 80) / (chartData.length - 1)));
    
    if (dataIndex >= 0 && dataIndex < chartData.length) {
      setHoveredPoint(chartData[dataIndex]);
      setMousePosition({ x: event.clientX, y: event.clientY });
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span>Live Market Ticker</span>
          <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
            <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              {stocks.map(stock => (
                <SelectItem key={stock.symbol} value={stock.symbol} className="text-white hover:bg-gray-700">
                  {stock.symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Price Data */}
          <div className="space-y-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">{currentStock.symbol}</h3>
              <div className="text-3xl font-bold text-white">${currentStock.price.toFixed(2)}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-lg font-semibold ${
                  currentStock.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {currentStock.change >= 0 ? '+' : ''}{currentStock.change.toFixed(2)}
                </span>
                <Badge className={`${
                  currentStock.changePercent >= 0 ? 'bg-green-600' : 'bg-red-600'
                }`}>
                  {currentStock.changePercent >= 0 ? '+' : ''}{currentStock.changePercent.toFixed(2)}%
                </Badge>
              </div>
              <div className="mt-3 space-y-1 text-sm text-gray-400">
                <div>Volume: {(currentStock.volume / 1000000).toFixed(1)}M</div>
                <div>Market Cap: {currentStock.marketCap}</div>
              </div>
            </div>
          </div>

          {/* Center Panel - Chart */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="relative">
                <svg 
                  width="100%" 
                  height="300" 
                  className="bg-gray-900 rounded"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {/* Chart Line */}
                  <path
                    d={chartData.map((point, i) => {
                      const x = 40 + (i / (chartData.length - 1)) * (100 - 80) + '%';
                      const y = 20 + ((maxPrice - point.price) / priceRange) * 260;
                      return `${i === 0 ? 'M' : 'L'} ${x.replace('%', '')} ${y}`;
                    }).join(' ')}
                    stroke="#3b82f6"
                    strokeWidth="2"
                    fill="none"
                  />
                  
                  {/* Data Points */}
                  {chartData.map((point, i) => {
                    const x = 40 + (i / (chartData.length - 1)) * (100 - 80);
                    const y = 20 + ((maxPrice - point.price) / priceRange) * 260;
                    return (
                      <circle
                        key={i}
                        cx={`${x}%`}
                        cy={y}
                        r="3"
                        fill="#3b82f6"
                        className="hover:r-5 cursor-pointer"
                      />
                    );
                  })}
                  
                  {/* Timeline (X-axis) */}
                  {chartData.filter((_, i) => i % 4 === 0).map((point, i) => {
                    const originalIndex = i * 4;
                    const x = 40 + (originalIndex / (chartData.length - 1)) * (100 - 80);
                    return (
                      <text
                        key={i}
                        x={`${x}%`}
                        y="290"
                        textAnchor="middle"
                        className="fill-gray-400 text-xs"
                      >
                        {point.time}
                      </text>
                    );
                  })}
                  
                  {/* Price axis (Y-axis) */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                    const price = minPrice + (maxPrice - minPrice) * (1 - ratio);
                    const y = 20 + ratio * 260;
                    return (
                      <g key={i}>
                        <line x1="35" y1={y} x2="40" y2={y} stroke="#6b7280" strokeWidth="1" />
                        <text x="30" y={y + 4} textAnchor="end" className="fill-gray-400 text-xs">
                          ${price.toFixed(0)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                
                {/* Hover Tooltip */}
                {hoveredPoint && (
                  <div 
                    className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg p-3 text-white text-sm shadow-lg pointer-events-none"
                    style={{
                      left: mousePosition.x + 10,
                      top: mousePosition.y - 10,
                      transform: 'translate(0, -100%)'
                    }}
                  >
                    <div className="font-semibold">{hoveredPoint.time}</div>
                    <div>Price: ${hoveredPoint.price.toFixed(2)}</div>
                    <div>Volume: {(hoveredPoint.volume / 1000000).toFixed(1)}M</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImprovedMarketTicker;