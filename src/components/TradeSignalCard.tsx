import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TradeSignal {
  symbol: string;
  strikePrice: number;
  expiration: string;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
}

interface TradeSignalCardProps {
  trade: TradeSignal;
  onExecute: (trade: TradeSignal) => void;
}

const TradeSignalCard: React.FC<TradeSignalCardProps> = ({ trade, onExecute }) => {
  const profitPotential = ((trade.exitPrice - trade.entryPrice) / trade.entryPrice * 100).toFixed(2);
  const riskReward = (trade.exitPrice - trade.entryPrice) / (trade.entryPrice - trade.stopLoss);

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Badge className="bg-blue-600">{trade.symbol}</Badge>
            Trade Signal
          </span>
          <Badge 
            className={`${parseFloat(profitPotential) > 0 ? 'bg-green-600' : 'bg-red-600'}`}
          >
            {profitPotential}% Potential
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400 text-sm">Strike Price</p>
            <p className="text-white font-semibold">${trade.strikePrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Expiration</p>
            <p className="text-white font-semibold">{trade.expiration}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Entry Price</p>
            <p className="text-green-400 font-semibold">${trade.entryPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Exit Price</p>
            <p className="text-blue-400 font-semibold">${trade.exitPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Stop Loss</p>
            <p className="text-red-400 font-semibold">${trade.stopLoss.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Risk/Reward</p>
            <p className="text-yellow-400 font-semibold">{riskReward.toFixed(2)}:1</p>
          </div>
        </div>
        
        <Button 
          onClick={() => onExecute(trade)}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
        >
          Execute Trade
        </Button>
      </CardContent>
    </Card>
  );
};

export default TradeSignalCard;