import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from '@/components/ui/use-toast';

interface TradeSignal {
  symbol: string;
  strikePrice: number;
  expiration: string;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  riskRewardRatio?: string;
  category?: string;
}

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

interface TradeFormProps {
  onTradeGenerated: (trade: TradeSignal) => void;
  selectedTrades?: HighPotentialTrade[];
  onTradesCleared?: () => void;
}

const TradeForm: React.FC<TradeFormProps> = ({ onTradeGenerated, selectedTrades, onTradesCleared }) => {
  const [symbol, setSymbol] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSignal, setCurrentSignal] = useState<TradeSignal | null>(null);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [pendingTrades, setPendingTrades] = useState<HighPotentialTrade[]>([]);
  const [generatedSignals, setGeneratedSignals] = useState<TradeSignal[]>([]);
  const [selectedSignalIndex, setSelectedSignalIndex] = useState<number>(0);
  const [isExecuting, setIsExecuting] = useState(false);
  
  const { addTrades } = useAppContext();

  useEffect(() => {
    if (selectedTrades && selectedTrades.length > 0) {
      if (currentSignal || symbol) {
        setPendingTrades(selectedTrades);
        setShowOverwriteDialog(true);
      } else {
        loadTradeData(selectedTrades[0]);
      }
    }
  }, [selectedTrades]);

  const loadTradeData = (trade: HighPotentialTrade) => {
    setSymbol(trade.symbol);
  };

  const handleOverwrite = () => {
    clearForm();
    if (pendingTrades.length > 0) {
      loadTradeData(pendingTrades[0]);
    }
    setShowOverwriteDialog(false);
  };

  const clearForm = () => {
    setSymbol('');
    setCurrentSignal(null);
    setGeneratedSignals([]);
    setSelectedSignalIndex(0);
  };

  const generateTrade = async () => {
    if (!symbol) return;
    
    setIsGenerating(true);
    
    try {
      const response = await fetch(
        'https://qhmgxmalxffllarmlqjn.supabase.co/functions/v1/362ffae4-9b23-4e39-b336-da822e9cc3d7',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols: symbol.split(',').map(s => s.trim()) })
        }
      );
      
      const data = await response.json();
      const newSignals: TradeSignal[] = data.signals || [];
      
      setGeneratedSignals(newSignals);
      setCurrentSignal(newSignals[0]);
      setSelectedSignalIndex(0);
      onTradeGenerated(newSignals[0]);
      
      toast({
        title: "Signals Generated",
        description: `Generated ${newSignals.length} trade signal(s)`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate trade signals",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSignalChange = (index: string) => {
    const idx = parseInt(index);
    setSelectedSignalIndex(idx);
    setCurrentSignal(generatedSignals[idx]);
  };

  const handleTradeExecuted = async () => {
    if (!currentSignal) return;
    
    setIsExecuting(true);
    
    try {
      const tradeData = {
        symbol: currentSignal.symbol,
        strikePrice: currentSignal.strikePrice,
        entryPrice: currentSignal.entryPrice,
        exitPrice: currentSignal.exitPrice,
        stopLoss: currentSignal.stopLoss,
        expiration: currentSignal.expiration,
        riskRewardRatio: currentSignal.riskRewardRatio || '1:2',
        projectedGain: ((currentSignal.exitPrice - currentSignal.entryPrice) / currentSignal.entryPrice) * 100,
        category: currentSignal.category || 'AI Generated'
      };
      
      addTrades([tradeData]);
      
      toast({
        title: "Trade Executed!",
        description: `${currentSignal.symbol} trade added to Active Trades`,
      });
      
      // Handle multiple signals
      if (generatedSignals.length > 1) {
        const remaining = generatedSignals.filter((_, i) => i !== selectedSignalIndex);
        setGeneratedSignals(remaining);
        if (remaining.length > 0) {
          const newIndex = Math.min(selectedSignalIndex, remaining.length - 1);
          setSelectedSignalIndex(newIndex);
          setCurrentSignal(remaining[newIndex]);
        } else {
          setCurrentSignal(null);
          setSelectedSignalIndex(0);
        }
      } else {
        setCurrentSignal(null);
        setGeneratedSignals([]);
        setSelectedSignalIndex(0);
      }
      
      if (pendingTrades.length > 0) {
        setPendingTrades([]);
        clearForm();
        onTradesCleared?.();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to execute trade",
        variant: "destructive"
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <>
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Badge className="bg-yellow-600">AI</Badge>
            Trade Signal Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="symbol" className="text-gray-300">Stock Symbol(s)</Label>
            <Input
              id="symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="e.g., AAPL, TSLA, MSFT (comma separated)"
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>
          
          <Button 
            onClick={generateTrade}
            disabled={!symbol || isGenerating}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-semibold"
          >
            {isGenerating ? 'Generating AI Signal...' : 'Generate Trade Signal'}
          </Button>
          
          {currentSignal && (
            <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Badge className="bg-blue-600">{currentSignal.symbol}</Badge>
                  Trade Signal
                </h3>
                {generatedSignals.length > 1 && (
                  <div className="flex items-center gap-2">
                    <Label className="text-gray-300 text-sm">Symbol:</Label>
                    <Select value={selectedSignalIndex.toString()} onValueChange={handleSignalChange}>
                      <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {generatedSignals.map((signal, index) => (
                          <SelectItem key={index} value={index.toString()} className="text-white hover:bg-gray-700">
                            {signal.symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-400 text-sm">Strike Price</p>
                  <p className="text-white font-semibold">${currentSignal.strikePrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Expiration</p>
                  <p className="text-white font-semibold">{currentSignal.expiration}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Entry Price</p>
                  <p className="text-green-400 font-semibold">${currentSignal.entryPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Exit Price</p>
                  <p className="text-blue-400 font-semibold">${currentSignal.exitPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Stop Loss</p>
                  <p className="text-red-400 font-semibold">${currentSignal.stopLoss.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Potential Gain</p>
                  <p className="text-yellow-400 font-semibold">
                    {(((currentSignal.exitPrice - currentSignal.entryPrice) / currentSignal.entryPrice) * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={handleTradeExecuted}
                disabled={isExecuting}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                {isExecuting ? 'Executing...' : 'Execute Trade'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showOverwriteDialog} onOpenChange={setShowOverwriteDialog}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Trade Data Exists</DialogTitle>
          </DialogHeader>
          <div className="text-gray-300 mb-4">
            The Trade Signal Generator already contains data. Would you like to overwrite it?
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowOverwriteDialog(false)} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleOverwrite} className="flex-1 bg-red-600 hover:bg-red-700">
              Overwrite
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TradeForm;