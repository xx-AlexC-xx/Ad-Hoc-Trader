import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import alphaVantageService, { AlphaVantageData } from '@/lib/alphaVantageService';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CrosshairData {
  x: number;
  y: number;
  data: AlphaVantageData;
  visible: boolean;
}

const LiveTickerChart: React.FC = () => {
  const [symbol, setSymbol] = useState('DJI'); // Dow Jones Industrial Average
  const [inputSymbol, setInputSymbol] = useState('');
  const [timeframe, setTimeframe] = useState('intraday');
  const [chartType, setChartType] = useState('line');
  const [indicators, setIndicators] = useState<string[]>([]);
  const [data, setData] = useState<AlphaVantageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [crosshair, setCrosshair] = useState<CrosshairData>({ x: 0, y: 0, data: {} as AlphaVantageData, visible: false });
  const [tradeSelection, setTradeSelection] = useState(false);
  const [dollarShares, setDollarShares] = useState('dollars');
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetchData();
  }, [symbol, timeframe]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      let chartData: AlphaVantageData[] = [];

      switch (timeframe) {
        case 'intraday':
          chartData = await alphaVantageService.getIntradayData(symbol, '5min');
          break;
        case '1week':
          chartData = await alphaVantageService.getDailyData(symbol);
          chartData = chartData.slice(-7);
          break;
        case '1month':
          chartData = await alphaVantageService.getDailyData(symbol);
          chartData = chartData.slice(-30);
          break;
        case '6months':
          chartData = await alphaVantageService.getWeeklyData(symbol);
          chartData = chartData.slice(-26);
          break;
        case 'ytd':
          chartData = await alphaVantageService.getDailyData(symbol);
          const yearStart = new Date(new Date().getFullYear(), 0, 1);
          chartData = chartData.filter(d => new Date(d.timestamp) >= yearStart);
          break;
        case '1year':
          chartData = await alphaVantageService.getWeeklyData(symbol);
          chartData = chartData.slice(-52);
          break;
        case '3years':
          chartData = await alphaVantageService.getMonthlyData(symbol);
          chartData = chartData.slice(-36);
          break;
        default:
          chartData = await alphaVantageService.getIntradayData(symbol);
      }

      setData(chartData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSymbolSubmit = () => {
    if (inputSymbol.trim()) {
      setSymbol(inputSymbol.trim().toUpperCase());
      setInputSymbol('');
    }
  };

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || data.length === 0) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const dataIndex = Math.round((x - 60) / (rect.width - 120) * (data.length - 1));
    if (dataIndex >= 0 && dataIndex < data.length) {
      setCrosshair({
        x,
        y,
        data: data[dataIndex],
        visible: true
      });
    }
  };

  const handleMouseLeave = () => {
    setCrosshair(prev => ({ ...prev, visible: false }));
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Live Ticker</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Live Ticker</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              {error || 'No data available'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const maxPrice = Math.max(...data.map(d => d.high));
  const minPrice = Math.min(...data.map(d => d.low));
  const priceRange = maxPrice - minPrice;
  const currentPrice = data[data.length - 1]?.close || 0;
  const firstPrice = data[0]?.close || 0;
  const priceChange = currentPrice - firstPrice;
  const percentChange = ((priceChange / firstPrice) * 100);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Live Ticker</span>
          <div className="flex items-center gap-4">
            <Badge className={percentChange >= 0 ? 'bg-green-600' : 'bg-red-600'}>
              {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(2)}%
            </Badge>
            <span className="text-2xl font-bold">
              ${currentPrice.toFixed(2)}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            <Input
              placeholder="Enter symbol (e.g., AAPL)"
              value={inputSymbol}
              onChange={(e) => setInputSymbol(e.target.value)}
              className="w-48"
              onKeyPress={(e) => e.key === 'Enter' && handleSymbolSubmit()}
            />
            <Button onClick={handleSymbolSubmit}>Load</Button>
          </div>
          
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="intraday">Intraday</SelectItem>
              <SelectItem value="1week">1 Week</SelectItem>
              <SelectItem value="1month">1 Month</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="ytd">YTD</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
              <SelectItem value="3years">3 Years</SelectItem>
            </SelectContent>
          </Select>

          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="mountain">Mountain</SelectItem>
              <SelectItem value="candlestick">Candlestick</SelectItem>
              <SelectItem value="ohlc">OHLC</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2">
            <Switch
              id="trade-selection"
              checked={tradeSelection}
              onCheckedChange={setTradeSelection}
            />
            <Label htmlFor="trade-selection">Trade Selection</Label>
          </div>

          <Select value={dollarShares} onValueChange={setDollarShares}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dollars">$</SelectItem>
              <SelectItem value="shares">#</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="destructive" size="sm">
            Cancel Trade
          </Button>
        </div>

        {/* Chart */}
        <div className="relative">
          <svg
            ref={svgRef}
            width="100%"
            height="400"
            className="border rounded"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Price axis (left) */}
            <g>
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const price = minPrice + (priceRange * (1 - ratio));
                const y = 40 + (320 * ratio);
                return (
                  <g key={i}>
                    <line x1={50} y1={y} x2={55} y2={y} stroke="#666" />
                    <text x={45} y={y + 4} textAnchor="end" fontSize="12" fill="#666">
                      ${price.toFixed(2)}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Percentage axis (right) */}
            <g>
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const price = minPrice + (priceRange * (1 - ratio));
                const percent = ((price - firstPrice) / firstPrice) * 100;
                const y = 40 + (320 * ratio);
                return (
                  <g key={i}>
                    <line x1="95%" y1={y} x2="96%" y2={y} stroke="#666" />
                    <text x="97%" y={y + 4} fontSize="12" fill="#666">
                      {percent >= 0 ? '+' : ''}{percent.toFixed(1)}%
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Chart content */}
            <g clipPath="url(#chartClip)">
              <defs>
                <clipPath id="chartClip">
                  <rect x={60} y={40} width="calc(100% - 120px)" height={320} />
                </clipPath>
              </defs>
              
              {chartType === 'line' && (
                <path
                  d={data.map((d, i) => {
                    const x = 60 + (i / (data.length - 1)) * (window.innerWidth * 0.8 - 120);
                    const y = 40 + ((maxPrice - d.close) / priceRange) * 320;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  stroke="#3b82f6"
                  strokeWidth="2"
                  fill="none"
                />
              )}
            </g>

            {/* Crosshair */}
            {crosshair.visible && (
              <g>
                <line x1={crosshair.x} y1={40} x2={crosshair.x} y2={360} stroke="#666" strokeDasharray="2,2" />
                <line x1={60} y1={crosshair.y} x2="95%" y2={crosshair.y} stroke="#666" strokeDasharray="2,2" />
                
                {/* Tooltip */}
                <foreignObject x={crosshair.x + 10} y={crosshair.y - 80} width={200} height={160}>
                  <div className="bg-black/80 text-white p-2 rounded text-xs">
                    <div>Date: {new Date(crosshair.data.timestamp).toLocaleDateString()}</div>
                    <div>Open: ${crosshair.data.open?.toFixed(2)}</div>
                    <div>High: ${crosshair.data.high?.toFixed(2)}</div>
                    <div>Low: ${crosshair.data.low?.toFixed(2)}</div>
                    <div>Close: ${crosshair.data.close?.toFixed(2)}</div>
                    <div>Volume: {crosshair.data.volume?.toLocaleString()}</div>
                  </div>
                </foreignObject>
              </g>
            )}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveTickerChart;