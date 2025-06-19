import React from 'react';

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

interface ChartRendererProps {
  chartData: ChartPoint[];
  chartType: ChartType;
  maxPrice: number;
  minPrice: number;
  priceRange: number;
  onMouseMove: (event: React.MouseEvent<SVGElement>) => void;
  onMouseLeave: () => void;
}

const ChartRenderer: React.FC<ChartRendererProps> = ({
  chartData,
  chartType,
  maxPrice,
  minPrice,
  priceRange,
  onMouseMove,
  onMouseLeave
}) => {
  const renderCandlestick = () => {
    return chartData.map((point, i) => {
      const x = 60 + (i / (chartData.length - 1)) * 70;
      const bodyTop = 40 + ((maxPrice - Math.max(point.open, point.close)) / priceRange) * 300;
      const bodyBottom = 40 + ((maxPrice - Math.min(point.open, point.close)) / priceRange) * 300;
      const wickTop = 40 + ((maxPrice - point.high) / priceRange) * 300;
      const wickBottom = 40 + ((maxPrice - point.low) / priceRange) * 300;
      const isGreen = point.close >= point.open;
      
      return (
        <g key={i}>
          <line
            x1={x}
            y1={wickTop}
            x2={x}
            y2={wickBottom}
            stroke={isGreen ? '#10b981' : '#ef4444'}
            strokeWidth="1"
          />
          <rect
            x={x - 3}
            y={bodyTop}
            width="6"
            height={Math.abs(bodyBottom - bodyTop) || 1}
            fill={isGreen ? '#10b981' : '#ef4444'}
            stroke={isGreen ? '#10b981' : '#ef4444'}
          />
        </g>
      );
    });
  };

  const renderLine = () => {
    const pathData = chartData.map((point, i) => {
      const x = 60 + (i / (chartData.length - 1)) * 70;
      const y = 40 + ((maxPrice - point.close) / priceRange) * 300;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    return (
      <path
        d={pathData}
        stroke="#3b82f6"
        strokeWidth="2"
        fill="none"
      />
    );
  };

  const renderMountain = () => {
    const pathData = chartData.map((point, i) => {
      const x = 60 + (i / (chartData.length - 1)) * 70;
      const y = 40 + ((maxPrice - point.close) / priceRange) * 300;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    const closePath = `L ${60 + 70} 340 L 60 340 Z`;
    
    return (
      <path
        d={pathData + closePath}
        stroke="#3b82f6"
        strokeWidth="2"
        fill="url(#mountainGradient)"
      />
    );
  };

  const renderOHLC = () => {
    return chartData.map((point, i) => {
      const x = 60 + (i / (chartData.length - 1)) * 70;
      const openY = 40 + ((maxPrice - point.open) / priceRange) * 300;
      const highY = 40 + ((maxPrice - point.high) / priceRange) * 300;
      const lowY = 40 + ((maxPrice - point.low) / priceRange) * 300;
      const closeY = 40 + ((maxPrice - point.close) / priceRange) * 300;
      const isGreen = point.close >= point.open;
      
      return (
        <g key={i}>
          <line x1={x} y1={highY} x2={x} y2={lowY} stroke={isGreen ? '#10b981' : '#ef4444'} strokeWidth="1" />
          <line x1={x - 3} y1={openY} x2={x} y2={openY} stroke={isGreen ? '#10b981' : '#ef4444'} strokeWidth="2" />
          <line x1={x} y1={closeY} x2={x + 3} y2={closeY} stroke={isGreen ? '#10b981' : '#ef4444'} strokeWidth="2" />
        </g>
      );
    });
  };

  const renderChart = () => {
    switch (chartType) {
      case 'candlestick':
        return renderCandlestick();
      case 'line':
        return renderLine();
      case 'mountain':
        return renderMountain();
      case 'ohlc':
        return renderOHLC();
      case 'advanced':
        return renderCandlestick();
      default:
        return renderCandlestick();
    }
  };

  return (
    <svg 
      width="100%" 
      height="100%" 
      className="bg-black"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <defs>
        <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      
      {renderChart()}
      
      {chartData.filter((_, i) => i % 5 === 0).map((point, i) => {
        const originalIndex = i * 5;
        const x = 60 + (originalIndex / (chartData.length - 1)) * 70;
        return (
          <text
            key={i}
            x={x}
            y="370"
            textAnchor="middle"
            className="fill-gray-400 text-xs"
          >
            {point.time}
          </text>
        );
      })}
      
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
        const price = minPrice + (maxPrice - minPrice) * (1 - ratio);
        const y = 40 + ratio * 300;
        return (
          <g key={i}>
            <line x1="55" y1={y} x2="60" y2={y} stroke="#6b7280" strokeWidth="1" />
            <text x="50" y={y + 4} textAnchor="end" className="fill-gray-400 text-xs">
              ${price.toFixed(0)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default ChartRenderer;