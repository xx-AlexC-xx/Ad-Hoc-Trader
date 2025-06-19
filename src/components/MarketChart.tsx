import React from 'react';

interface MarketChartProps {
  chartType: 'candlestick' | 'line' | 'mountain';
  symbol: string;
}

const MarketChart: React.FC<MarketChartProps> = ({ chartType, symbol }) => {
  const generateMockData = () => {
    const data = [];
    let price = 100 + Math.random() * 50;
    
    for (let i = 0; i < 30; i++) {
      const change = (Math.random() - 0.5) * 10;
      price = Math.max(10, price + change);
      data.push({
        x: i * 10,
        y: price,
        high: price + Math.random() * 5,
        low: price - Math.random() * 5,
        open: price - change / 2,
        close: price
      });
    }
    return data;
  };

  const data = generateMockData();
  const maxPrice = Math.max(...data.map(d => d.high || d.y));
  const minPrice = Math.min(...data.map(d => d.low || d.y));
  const priceRange = maxPrice - minPrice;

  const renderCandlestickChart = () => (
    <svg width="100%" height="200" className="bg-gray-800 rounded">
      {data.map((point, i) => {
        const x = (i / (data.length - 1)) * 280 + 10;
        const bodyTop = ((maxPrice - Math.max(point.open, point.close)) / priceRange) * 180 + 10;
        const bodyBottom = ((maxPrice - Math.min(point.open, point.close)) / priceRange) * 180 + 10;
        const wickTop = ((maxPrice - point.high) / priceRange) * 180 + 10;
        const wickBottom = ((maxPrice - point.low) / priceRange) * 180 + 10;
        const isGreen = point.close > point.open;
        
        return (
          <g key={i}>
            <line x1={x} y1={wickTop} x2={x} y2={wickBottom} stroke={isGreen ? '#10b981' : '#ef4444'} strokeWidth="1" />
            <rect
              x={x - 3}
              y={bodyTop}
              width="6"
              height={Math.max(1, bodyBottom - bodyTop)}
              fill={isGreen ? '#10b981' : '#ef4444'}
            />
          </g>
        );
      })}
    </svg>
  );

  const renderLineChart = () => {
    const pathData = data.map((point, i) => {
      const x = (i / (data.length - 1)) * 280 + 10;
      const y = ((maxPrice - point.y) / priceRange) * 180 + 10;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
      <svg width="100%" height="200" className="bg-gray-800 rounded">
        <path d={pathData} stroke="#3b82f6" strokeWidth="2" fill="none" />
        {data.map((point, i) => {
          const x = (i / (data.length - 1)) * 280 + 10;
          const y = ((maxPrice - point.y) / priceRange) * 180 + 10;
          return <circle key={i} cx={x} cy={y} r="2" fill="#3b82f6" />;
        })}
      </svg>
    );
  };

  const renderMountainChart = () => {
    const pathData = data.map((point, i) => {
      const x = (i / (data.length - 1)) * 280 + 10;
      const y = ((maxPrice - point.y) / priceRange) * 180 + 10;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    const areaPath = pathData + ` L 290 190 L 10 190 Z`;

    return (
      <svg width="100%" height="200" className="bg-gray-800 rounded">
        <defs>
          <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#mountainGradient)" />
        <path d={pathData} stroke="#3b82f6" strokeWidth="2" fill="none" />
      </svg>
    );
  };

  return (
    <div className="mt-4">
      <div className="text-sm text-gray-400 mb-2">{symbol} - {chartType.toUpperCase()} Chart</div>
      {chartType === 'candlestick' && renderCandlestickChart()}
      {chartType === 'line' && renderLineChart()}
      {chartType === 'mountain' && renderMountainChart()}
    </div>
  );
};

export default MarketChart;