import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface ChartDataPoint {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface EnhancedMarketChartProps {
  chartType: 'candlestick' | 'line' | 'mountain';
  symbol: string;
}

const EnhancedMarketChart: React.FC<EnhancedMarketChartProps> = ({ chartType, symbol }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; data?: ChartDataPoint }>({ visible: false, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const generateChartData = (): ChartDataPoint[] => {
    const data: ChartDataPoint[] = [];
    let price = 100 + Math.random() * 50;
    const now = new Date();
    
    for (let i = 0; i < 50; i++) {
      const timestamp = new Date(now.getTime() - (49 - i) * 60 * 60 * 1000);
      const change = (Math.random() - 0.5) * 8;
      const open = price;
      price = Math.max(10, price + change);
      const close = price;
      const high = Math.max(open, close) + Math.random() * 3;
      const low = Math.min(open, close) - Math.random() * 3;
      const volume = Math.floor(Math.random() * 1000000) + 100000;
      
      data.push({ timestamp, open, high, low, close, volume });
    }
    return data;
  };

  const [chartData] = useState(generateChartData());
  const chartWidth = 600;
  const chartHeight = 300;
  
  const maxPrice = Math.max(...chartData.map(d => d.high));
  const minPrice = Math.min(...chartData.map(d => d.low));
  const priceRange = maxPrice - minPrice;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging) {
      const deltaX = x - lastMousePos.x;
      const deltaY = y - lastMousePos.y;
      setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      setLastMousePos({ x, y });
      return;
    }

    const dataIndex = Math.floor(((x - pan.x) / zoom) / (chartWidth / chartData.length));
    if (dataIndex >= 0 && dataIndex < chartData.length) {
      setTooltip({ visible: true, x, y, data: chartData[dataIndex] });
    } else {
      setTooltip({ visible: false, x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsDragging(true);
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      setLastMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(5, prev * zoomFactor)));
  };

  const renderCandlesticks = () => {
    return chartData.map((point, i) => {
      const x = (i / (chartData.length - 1)) * chartWidth * zoom + pan.x;
      const bodyTop = ((maxPrice - Math.max(point.open, point.close)) / priceRange) * chartHeight + pan.y;
      const bodyBottom = ((maxPrice - Math.min(point.open, point.close)) / priceRange) * chartHeight + pan.y;
      const wickTop = ((maxPrice - point.high) / priceRange) * chartHeight + pan.y;
      const wickBottom = ((maxPrice - point.low) / priceRange) * chartHeight + pan.y;
      const isGreen = point.close > point.open;
      
      return (
        <g key={i}>
          <line x1={x} y1={wickTop} x2={x} y2={wickBottom} stroke={isGreen ? '#10b981' : '#ef4444'} strokeWidth="1" />
          <rect
            x={x - 3 * zoom}
            y={bodyTop}
            width={6 * zoom}
            height={Math.max(1, bodyBottom - bodyTop)}
            fill={isGreen ? '#10b981' : '#ef4444'}
          />
        </g>
      );
    });
  };

  const renderLine = () => {
    const pathData = chartData.map((point, i) => {
      const x = (i / (chartData.length - 1)) * chartWidth * zoom + pan.x;
      const y = ((maxPrice - point.close) / priceRange) * chartHeight + pan.y;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return <path d={pathData} stroke="#3b82f6" strokeWidth="2" fill="none" />;
  };

  const renderMountain = () => {
    const pathData = chartData.map((point, i) => {
      const x = (i / (chartData.length - 1)) * chartWidth * zoom + pan.x;
      const y = ((maxPrice - point.close) / priceRange) * chartHeight + pan.y;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    const areaPath = pathData + ` L ${chartWidth * zoom + pan.x} ${chartHeight + pan.y} L ${pan.x} ${chartHeight + pan.y} Z`;

    return (
      <>
        <path d={areaPath} fill="url(#mountainGradient)" />
        <path d={pathData} stroke="#3b82f6" strokeWidth="2" fill="none" />
      </>
    );
  };

  return (
    <div className="relative">
      <Card className="bg-gray-800 p-4">
        <div className="mb-2 text-sm text-gray-400">
          {symbol} - {chartType.toUpperCase()} Chart (Zoom: {zoom.toFixed(1)}x)
        </div>
        <svg
          ref={svgRef}
          width={chartWidth}
          height={chartHeight}
          className="bg-gray-900 rounded cursor-move"
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { setTooltip({ visible: false, x: 0, y: 0 }); setIsDragging(false); }}
          onWheel={handleWheel}
        >
          <defs>
            <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          {chartType === 'candlestick' && renderCandlesticks()}
          {chartType === 'line' && renderLine()}
          {chartType === 'mountain' && renderMountain()}
        </svg>
        
        {tooltip.visible && tooltip.data && (
          <div 
            className="absolute bg-gray-700 text-white p-2 rounded shadow-lg text-xs z-10"
            style={{ left: tooltip.x + 10, top: tooltip.y - 10 }}
          >
            <div><strong>{tooltip.data.timestamp.toLocaleString()}</strong></div>
            <div>Open: ${tooltip.data.open.toFixed(2)}</div>
            <div>High: ${tooltip.data.high.toFixed(2)}</div>
            <div>Low: ${tooltip.data.low.toFixed(2)}</div>
            <div>Close: ${tooltip.data.close.toFixed(2)}</div>
            <div>Volume: {tooltip.data.volume.toLocaleString()}</div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default EnhancedMarketChart;