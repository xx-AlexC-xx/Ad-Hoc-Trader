import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/AppContext';

const ActiveTrades: React.FC = () => {
  const { activeTrades, closeTrade, cancelTrade } = useAppContext();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-600';
      case 'active': return 'bg-green-600';
      case 'closed': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusText = (trade: any) => {
    switch (trade.status) {
      case 'pending': return 'Waiting for Entry';
      case 'active': return 'In Position';
      case 'closed': return `Closed (${trade.exitReason})`;
      default: return trade.status;
    }
  };

  const getPnLColor = (pnl?: number) => {
    if (!pnl) return 'text-gray-400';
    return pnl >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const getProgressValue = (trade: any) => {
    if (trade.status === 'pending') return 0;
    if (trade.status === 'closed') return 100;
    
    const current = trade.currentPrice || trade.entryPrice;
    const range = trade.exitPrice - trade.entryPrice;
    const progress = ((current - trade.entryPrice) / range) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  if (activeTrades.length === 0) {
    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">📊 Active Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-400 py-8">
            No active trades. Select trades from High Potential Symbols to get started.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span>📊 Active Trades</span>
          <Badge className="bg-blue-600">{activeTrades.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeTrades.map((trade) => (
            <div key={trade.id} className="bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600">{trade.symbol}</Badge>
                  <Badge className={getStatusColor(trade.status)}>
                    {getStatusText(trade)}
                  </Badge>
                  {trade.category && (
                    <Badge className="bg-purple-600">{trade.category}</Badge>
                  )}
                </div>
                <div className={`font-semibold ${getPnLColor(trade.pnl)}`}>
                  {trade.pnl ? `${trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}%` : '--'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
                <div>
                  <span className="text-gray-400">Current:</span>
                  <span className="text-white ml-1">
                    ${(trade.currentPrice || trade.entryPrice).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Entry:</span>
                  <span className="text-white ml-1">${trade.entryPrice.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Target:</span>
                  <span className="text-white ml-1">${trade.exitPrice.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Stop:</span>
                  <span className="text-white ml-1">${trade.stopLoss.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progress to Target</span>
                  <span>{getProgressValue(trade).toFixed(0)}%</span>
                </div>
                <Progress 
                  value={getProgressValue(trade)} 
                  className="h-2"
                />
              </div>
              
              {trade.status !== 'closed' && (
                <div className="flex gap-2 mb-2">
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => closeTrade(trade.id)}
                  >
                    Close Trade
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => cancelTrade(trade.id)}
                  >
                    Cancel Trade
                  </Button>
                </div>
              )}
              
              <div className="text-xs text-gray-400">
                <span>Exp: {new Date(trade.expiration).toLocaleDateString()}</span>
                {trade.entryTime && (
                  <span className="ml-4">
                    Entered: {new Date(trade.entryTime).toLocaleTimeString()}
                  </span>
                )}
                {trade.exitTime && (
                  <span className="ml-4">
                    Exited: {new Date(trade.exitTime).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveTrades;