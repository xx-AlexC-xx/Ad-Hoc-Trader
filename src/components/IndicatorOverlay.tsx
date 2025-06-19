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

type IndicatorType = 'volume' | 'ma' | 'momentum' | 'macd' | 'stochastics' | 'rsi' | 'bollinger' | 'supertrend' | 'atr';

interface IndicatorOverlayProps {
  chartData: ChartPoint[];
  indicators: IndicatorType[];
  maxPrice: number;
  minPrice: number;
  priceRange: number;
  chartWidth: number;
  chartHeight: number;
}

const IndicatorOverlay: React.FC<IndicatorOverlayProps> = ({
  chartData,
  indicators,
  maxPrice,
  minPrice,
  priceRange,
  chartWidth = 600,
  chartHeight = 300
}) => {
  const calculateMA = (period: number = 20) => {
    return chartData.map((_, i) => {
      if (i < period - 1) return null;
      const sum = chartData.slice(i - period + 1, i + 1).reduce((acc, p) => acc + p.close, 0);
      return sum / period;
    });
  };

  const calculateRSI = (period: number = 14) => {
    const changes = chartData.map((p, i) => i > 0 ? p.close - chartData[i-1].close : 0);
    return chartData.map((_, i) => {
      if (i < period) return 50;
      const gains = changes.slice(i - period + 1, i + 1).filter(c => c > 0);
      const losses = changes.slice(i - period + 1, i + 1).filter(c => c < 0).map(c => Math.abs(c));
      const avgGain = gains.reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.reduce((a, b) => a + b, 0) / period;
      return avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
    });
  };

  const renderMovingAverage = () => {
    const ma = calculateMA();
    const pathData = ma.map((value, i) => {
      if (value === null) return '';
      const x = 60 + (i / (chartData.length - 1)) * (chartWidth - 120);
      const y = 40 + ((maxPrice - value) / priceRange) * chartHeight;
      return `${i === 0 || ma[i-1] === null ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    return (
      <path
        d={pathData}
        stroke="#f59e0b"
        strokeWidth="2"
        fill="none"
        opacity="0.8"
      />
    );
  };

  const renderBollingerBands = () => {
    const ma = calculateMA();
    const upperBand = ma.map((value, i) => {
      if (value === null) return null;
      const period = Math.min(20, i + 1);
      const slice = chartData.slice(Math.max(0, i - period + 1), i + 1);
      const variance = slice.reduce((acc, p) => acc + Math.pow(p.close - value, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      return value + (2 * stdDev);
    });
    
    const lowerBand = ma.map((value, i) => {
      if (value === null) return null;
      const period = Math.min(20, i + 1);
      const slice = chartData.slice(Math.max(0, i - period + 1), i + 1);
      const variance = slice.reduce((acc, p) => acc + Math.pow(p.close - value, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      return value - (2 * stdDev);
    });

    const upperPath = upperBand.map((value, i) => {
      if (value === null) return '';
      const x = 60 + (i / (chartData.length - 1)) * (chartWidth - 120);
      const y = 40 + ((maxPrice - value) / priceRange) * chartHeight;
      return `${i === 0 || upperBand[i-1] === null ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    const lowerPath = lowerBand.map((value, i) => {
      if (value === null) return '';
      const x = 60 + (i / (chartData.length - 1)) * (chartWidth - 120);
      const y = 40 + ((maxPrice - value) / priceRange) * chartHeight;
      return `${i === 0 || lowerBand[i-1] === null ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
      <g>
        <path d={upperPath} stroke="#8b5cf6" strokeWidth="1" fill="none" opacity="0.6" />
        <path d={lowerPath} stroke="#8b5cf6" strokeWidth="1" fill="none" opacity="0.6" />
      </g>
    );
  };

  return (
    <g>
      {indicators.includes('ma') && renderMovingAverage()}
      {indicators.includes('bollinger') && renderBollingerBands()}
    </g>
  );
};

export default IndicatorOverlay;