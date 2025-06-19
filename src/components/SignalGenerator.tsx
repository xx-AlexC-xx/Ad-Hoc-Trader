import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface TradeSignal {
  symbol: string;
  strikePoint: number;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  expiration: string;
  riskReward: string;
  tradeType: string;
}

const SignalGenerator: React.FC = () => {
  const [symbol, setSymbol] = useState('');
  const [signal, setSignal] = useState<TradeSignal | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [editedField, setEditedField] = useState('');
  const [tempValue, setTempValue] = useState('');

  const generateSignal = async () => {
    if (!symbol.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      const basePrice = 100 + Math.random() * 200;
      const newSignal: TradeSignal = {
        symbol: symbol.toUpperCase(),
        strikePoint: Number((basePrice * 1.02).toFixed(2)),
        entryPrice: Number(basePrice.toFixed(2)),
        exitPrice: Number((basePrice * 1.15).toFixed(2)),
        stopLoss: Number((basePrice * 0.92).toFixed(2)),
        expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        riskReward: '1:3',
        tradeType: 'CALL'
      };
      
      setSignal(newSignal);
      setIsGenerating(false);
    }, 2000);
  };

  const handleFieldEdit = (field: string, value: string) => {
    setEditedField(field);
    setTempValue(value);
    setShowWarning(true);
  };

  const confirmEdit = () => {
    if (signal && editedField) {
      setSignal({
        ...signal,
        [editedField]: editedField === 'expiration' ? tempValue : Number(tempValue)
      });
    }
    setShowWarning(false);
    setEditedField('');
    setTempValue('');
  };

  const executeTrade = () => {
    if (signal) {
      alert(`Trade executed for ${signal.symbol}!`);
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">🎯 Signal Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="symbol" className="text-white">Stock Symbol</Label>
          <div className="flex gap-2">
            <Input
              id="symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="Enter symbol (e.g., AAPL)"
              className="bg-gray-800 border-gray-600 text-white"
            />
            <Button 
              onClick={generateSignal}
              disabled={isGenerating || !symbol.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? 'Analyzing...' : 'Generate'}
            </Button>
          </div>
        </div>

        {signal && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">AI Generated Trade Signal</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Strike Point</Label>
                <Input
                  value={signal.strikePoint}
                  onChange={(e) => handleFieldEdit('strikePoint', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300">Entry Price</Label>
                <Input
                  value={signal.entryPrice}
                  onChange={(e) => handleFieldEdit('entryPrice', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300">Exit Price</Label>
                <Input
                  value={signal.exitPrice}
                  onChange={(e) => handleFieldEdit('exitPrice', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300">Stop Loss</Label>
                <Input
                  value={signal.stopLoss}
                  onChange={(e) => handleFieldEdit('stopLoss', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300">Expiration</Label>
                <Input
                  type="date"
                  value={signal.expiration}
                  onChange={(e) => handleFieldEdit('expiration', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-gray-300">Risk/Reward</Label>
                <Input
                  value={signal.riskReward}
                  onChange={(e) => handleFieldEdit('riskReward', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Trade Type</Label>
              <Select value={signal.tradeType} onValueChange={(value) => setSignal({...signal, tradeType: value})}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CALL">CALL</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="LONG">LONG</SelectItem>
                  <SelectItem value="SHORT">SHORT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={executeTrade}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
            >
              Execute Trade
            </Button>
          </div>
        )}

        <Dialog open={showWarning} onOpenChange={setShowWarning}>
          <DialogContent className="bg-gray-800 border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-white">⚠️ Warning</DialogTitle>
              <DialogDescription className="text-gray-300">
                You are about to change the AI generated data. This may affect the trade's performance. Do you want to proceed?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowWarning(false)}>
                Cancel
              </Button>
              <Button onClick={confirmEdit} className="bg-red-600 hover:bg-red-700">
                Proceed
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default SignalGenerator;