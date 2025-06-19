import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface HighPotentialTrade {
  symbol: string;
  strikePrice: number;
  entryPrice: number;
  expiration: string;
  exitPrice: number;
  stopLoss: number;
  riskRewardRatio: string;
  projectedGain: number;
  category?: string;
}

interface HighPotentialTradesProps {
  onSymbolsUpdate: (symbols: string[]) => void;
  onTradesSelected: (trades: HighPotentialTrade[]) => void;
}

const HighPotentialTrades: React.FC<HighPotentialTradesProps> = ({ onSymbolsUpdate, onTradesSelected }) => {
  const [trades, setTrades] = useState<HighPotentialTrade[]>([]);
  const [selectedTrades, setSelectedTrades] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const categories = ['Runner', 'On Fire', 'Breakout', 'Multibagger', 'Homerun'];

  const generateMockTrades = () => {
    const symbols = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NFLX', 'AMD', 'CRM'];
    const mockTrades: HighPotentialTrade[] = symbols.map(symbol => {
      const entryPrice = 50 + Math.random() * 200;
      const exitPrice = entryPrice * (1 + Math.random() * 0.5);
      const stopLoss = entryPrice * (0.8 + Math.random() * 0.15);
      const projectedGain = ((exitPrice - entryPrice) / entryPrice) * 100;
      
      return {
        symbol,
        strikePrice: entryPrice + Math.random() * 20,
        entryPrice,
        expiration: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        exitPrice,
        stopLoss,
        riskRewardRatio: `1:${(Math.random() * 3 + 1).toFixed(1)}`,
        projectedGain,
        category: Math.random() > 0.3 ? categories[Math.floor(Math.random() * categories.length)] : undefined
      };
    });
    
    return mockTrades.sort((a, b) => b.projectedGain - a.projectedGain);
  };

  const refreshTrades = () => {
    setLoading(true);
    setTimeout(() => {
      const newTrades = generateMockTrades();
      setTrades(newTrades);
      onSymbolsUpdate(newTrades.map(t => t.symbol));
      setSelectedTrades(new Set());
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    refreshTrades();
  }, []);

  const handleTradeSelection = (symbol: string, checked: boolean) => {
    const newSelected = new Set(selectedTrades);
    if (checked) {
      newSelected.add(symbol);
    } else {
      newSelected.delete(symbol);
    }
    setSelectedTrades(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTrades(new Set(trades.map(t => t.symbol)));
    } else {
      setSelectedTrades(new Set());
    }
  };

  const handleMakeTrade = () => {
    const selected = trades.filter(t => selectedTrades.has(t.symbol));
    if (selected.length > 0) {
      setShowConfirmDialog(true);
    }
  };

  const confirmTrades = () => {
    const selected = trades.filter(t => selectedTrades.has(t.symbol));
    onTradesSelected(selected);
    setSelectedTrades(new Set());
    setShowConfirmDialog(false);
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'Runner': return 'bg-blue-600';
      case 'On Fire': return 'bg-red-600';
      case 'Breakout': return 'bg-green-600';
      case 'Multibagger': return 'bg-purple-600';
      case 'Homerun': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <>
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>🔍 High Potential Trade Symbols (AI Generated)</span>
            <Button onClick={refreshTrades} disabled={loading} size="sm">
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trades.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No potential trades available at the moment.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-700">
                <Checkbox
                  checked={selectedTrades.size === trades.length}
                  onCheckedChange={handleSelectAll}
                  className="border-gray-600"
                />
                <span className="text-gray-300 text-sm">Select All</span>
              </div>
              <div className="space-y-3">
                {trades.map((trade, index) => (
                  <div key={`${trade.symbol}-${index}`} className="bg-gray-800 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedTrades.has(trade.symbol)}
                          onCheckedChange={(checked) => handleTradeSelection(trade.symbol, checked as boolean)}
                          className="border-gray-600"
                        />
                        <Badge className="bg-blue-600">{trade.symbol}</Badge>
                        {trade.category && (
                          <Badge className={getCategoryColor(trade.category)}>
                            {trade.category}
                          </Badge>
                        )}
                      </div>
                      <div className="text-green-400 font-semibold">
                        +{trade.projectedGain.toFixed(1)}%
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Strike:</span>
                        <span className="text-white ml-1">${trade.strikePrice.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Entry:</span>
                        <span className="text-white ml-1">${trade.entryPrice.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Exit:</span>
                        <span className="text-white ml-1">${trade.exitPrice.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Stop:</span>
                        <span className="text-white ml-1">${trade.stopLoss.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Exp:</span>
                        <span className="text-white ml-1">{trade.expiration}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">R/R:</span>
                        <span className="text-white ml-1">{trade.riskRewardRatio}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {selectedTrades.size > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <Button
                    onClick={handleMakeTrade}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                  >
                    Make Trade ({selectedTrades.size} selected)
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Confirm Trades</DialogTitle>
          </DialogHeader>
          <div className="text-gray-300">
            You are about to initiate {selectedTrades.size} trade{selectedTrades.size > 1 ? 's' : ''}. Confirm?
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={() => setShowConfirmDialog(false)} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={confirmTrades} className="flex-1 bg-green-600 hover:bg-green-700">
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HighPotentialTrades;