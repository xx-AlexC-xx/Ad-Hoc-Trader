import React from 'react';
import IndicatorOverlay from './IndicatorOverlay';

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

interface EnhancedChartRendererProps {
  chartData: ChartPoint[];
  chartType: ChartType;
  indicators: IndicatorType[];
  maxPrice: number;
  minPrice: number;
  priceRange: number;
  onMouseMove: (event: React.MouseEvent<SVGElement>) => void;
  onMouseLeave: () => void;
}

const EnhancedChartRenderer: React.FC<EnhancedChartRendererProps> = ({
  chartData,
  chartType,
  indicators,
  maxPrice,
  minPrice,
  priceRange,
  onMouseMove,
  onMouseLeave
}) => {
  const chartWidth = 800;
  const mainChartHeight = 400;
  const indicatorHeight = 120;
  const totalHeight = mainChartHeight + (indicators.includes('volume') || indicators.includes('rsi') || indicators.includes('macd') ? indicatorHeight : 0);

  const renderCandlestick = () => {
    return chartData.map((point, i) => {
      const x = 60 + (i / (chartData.length - 1)) * (chartWidth - 120);
      const bodyTop = 40 + ((maxPrice - Math.max(point.open, point.close)) / priceRange) * mainChartHeight;
      const bodyBottom = 40 + ((maxPrice - Math.min(point.open, point.close)) / priceRange) * mainChartHeight;
      const wickTop = 40 + ((maxPrice - point.high) / priceRange) * mainChartHeight;
      const wickBottom = 40 + ((maxPrice - point.low) / priceRange) * mainChartHeight;
      const isGreen = point.close >= point.open;
      
      return (
        <g key={i}>
          <line x1={x} y1={wickTop} x2={x} y2={wickBottom} stroke={isGreen ? '#10b981' : '#ef4444'} strokeWidth="1" />
          <rect x={x - 4} y={bodyTop} width="8" height={Math.abs(bodyBottom - bodyTop) || 1} fill={isGreen ? '#10b981' : '#ef4444'} />
        </g>
      );
    });
  };

  const renderLine = () => {
    const pathData = chartData.map((point, i) => {
      const x = 60 + (i / (chartData.length - 1)) * (chartWidth - 120);
      const y = 40 + ((maxPrice - point.close) / priceRange) * mainChartHeight;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    return <path d={pathData} stroke="#3b82f6" strokeWidth="2" fill="none" />;
  };

  const renderVolumeIndicator = () => {
    if (!indicators.includes('volume')) return null;
    
    const maxVolume = Math.max(...chartData.map(d => d.volume));
    const volumeY = mainChartHeight + 60;
    
    return (
      <g>
        <text x="30" y={volumeY + 10} className="fill-gray-400 text-xs">Volume</text>
        {chartData.map((point, i) => {
          const x = 60 + (i / (chartData.length - 1)) * (chartWidth - 120);
          const height = (point.volume / maxVolume) * (indicatorHeight - 40);
          return (
            <rect
              key={i}
              x={x - 2}
              y={volumeY + (indicatorHeight - 40) - height}
              width="4"
              height={height}
              fill="#6b7280"
              opacity="0.7"
            />
          );
        })}
      </g>
    );
  };

  const renderChart = () => {
    switch (chartType) {
      case 'candlestick':
      case 'advanced':
        return renderCandlestick();
      case 'line':
        return renderLine();
      case 'mountain':
        const pathData = chartData.map((point, i) => {
          const x = 60 + (i / (chartData.length - 1)) * (chartWidth - 120);
          const y = 40 + ((maxPrice - point.close) / priceRange) * mainChartHeight;
          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
        const closePath = `L ${60 + (chartWidth - 120)} ${40 + mainChartHeight} L 60 ${40 + mainChartHeight} Z`;
        return <path d={pathData + closePath} stroke="#3b82f6" strokeWidth="2" fill="url(#mountainGradient)" />;
      case 'ohlc':
        return chartData.map((point, i) => {
          const x = 60 + (i / (chartData.length - 1)) * (chartWidth - 120);
          const openY = 40 + ((maxPrice - point.open) / priceRange) * mainChartHeight;
          const highY = 40 + ((maxPrice - point.high) / priceRange) * mainChartHeight;
          const lowY = 40 + ((maxPrice - point.low) / priceRange) * mainChartHeight;
          const closeY = 40 + ((maxPrice - point.close) / priceRange) * mainChartHeight;
          const isGreen = point.close >= point.open;
          
          return (
            <g key={i}>
              <line x1={x} y1={highY} x2={x} y2={lowY} stroke={isGreen ? '#10b981' : '#ef4444'} strokeWidth="1" />
              <line x1={x - 3} y1={openY} x2={x} y2={openY} stroke={isGreen ? '#10b981' : '#ef4444'} strokeWidth="2" />
              <line x1={x} y1={closeY} x2={x + 3} y2={closeY} stroke={isGreen ? '#10b981' : '#ef4444'} strokeWidth="2" />
            </g>
          );
        });
      default:
        return renderCandlestick();
    }
  };

  return (
    <svg width="100%" height={totalHeight + 100} className="bg-black" onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
      <defs>
        <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      
      {renderChart()}
      
      <IndicatorOverlay
        chartData={chartData}
        indicators={indicators}
        maxPrice={maxPrice}
        minPrice={minPrice}
        priceRange={priceRange}
        chartWidth={chartWidth}
        chartHeight={mainChartHeight}
      />
      
      {renderVolumeIndicator()}
      
      {chartData.filter((_, i) => i % Math.max(1, Math.floor(chartData.length / 8)) === 0).map((point, i) => {
        const originalIndex = i * Math.max(1, Math.floor(chartData.length / 8));
        const x = 60 + (originalIndex / (chartData.length - 1)) * (chartWidth - 120);
        return (
          <text key={i} x={x} y={totalHeight + 80} textAnchor="middle" className="fill-gray-400 text-xs">
            {point.time}
          </text>
        );
      })}
      
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
        const price = minPrice + (maxPrice - minPrice) * (1 - ratio);
        const y = 40 + ratio * mainChartHeight;
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

export default EnhancedChartRenderer;