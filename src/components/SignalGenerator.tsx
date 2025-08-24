import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';

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

export const SignalGenerator: React.FC = () => {
  const [symbol, setSymbol] = useState('');
  const [signal, setSignal] = useState<TradeSignal | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [editedField, setEditedField] = useState('');
  const [tempValue, setTempValue] = useState('');

  const fetchAlpacaQuote = async (symbol: string): Promise<number | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_alpaca_credentials')
        .select('api_key, secret_key')
        .eq('user_id', user.id)
        .single();

      if (error || !data) return null;

      const { api_key, secret_key: api_secret } = data;

      const res = await fetch(`https://data.alpaca.markets/v2/stocks/${symbol}/quotes/latest`, {
  headers: {
    'APCA-API-KEY-ID': api_key,
    'APCA-API-SECRET-KEY': api_secret,
        },
      });

      const quoteData = await res.json();
      return quoteData?.quote?.ap ?? null;
    } catch (err) {
      console.error('Failed to fetch Alpaca quote', err);
      return null;
    }
  };

  const generateSignal = async () => {
    if (!symbol.trim()) return;

    setIsGenerating(true);
    const price = await fetchAlpacaQuote(symbol.toUpperCase());

    if (!price) {
      alert('Failed to fetch quote from Alpaca.');
      setIsGenerating(false);
      return;
    }

    const newSignal: TradeSignal = {
      symbol: symbol.toUpperCase(),
      strikePoint: Number((price * 1.02).toFixed(2)),
      entryPrice: Number(price.toFixed(2)),
      exitPrice: Number((price * 1.15).toFixed(2)),
      stopLoss: Number((price * 0.92).toFixed(2)),
      expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      riskReward: '1:3',
      tradeType: 'CALL',
    };

    setSignal(newSignal);
    setIsGenerating(false);
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
        [editedField]: editedField === 'expiration' ? tempValue : Number(tempValue),
      });
    }
    setShowWarning(false);
    setEditedField('');
    setTempValue('');
  };

  const executeTrade = () => {
    if (signal) {
      alert(`Trade executed for ${signal.symbol}!`);
      // Placeholder: wire actual order placement here in future.
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Symbol Agent</CardTitle>
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
              {isGenerating ? 'Fetching...' : 'Generate'}
            </Button>
          </div>
        </div>

        {signal && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Alpaca Generated Signal</h3>

            <div className="grid grid-cols-2 gap-4">
              {['strikePoint', 'entryPrice', 'exitPrice', 'stopLoss'].map((field) => (
                <div className="space-y-2" key={field}>
                  <Label className="text-gray-300">
                    {field.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                  </Label>
                  <Input
                    value={signal[field as keyof TradeSignal]}
                    onChange={(e) => handleFieldEdit(field, e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              ))}

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
              <Select value={signal.tradeType} onValueChange={(value) => setSignal({ ...signal, tradeType: value })}>
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
                You are about to change the Alpaca-generated signal. Continue?
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
