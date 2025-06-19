import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HighPotentialTrades from './HighPotentialTrades';
import AdvancedMarketTicker from './AdvancedMarketTicker';
import SignalGenerator from './SignalGenerator';
import ActiveTrades from './ActiveTrades';
import TradeHistory from './TradeHistory';

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

const Dashboard: React.FC = () => {
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([]);
  const [selectedTrades, setSelectedTrades] = useState<HighPotentialTrade[]>([]);

  const handleSymbolsUpdate = (symbols: string[]) => {
    setWatchlistSymbols(symbols);
  };

  const handleTradesSelected = (trades: HighPotentialTrade[]) => {
    setSelectedTrades(trades);
    console.log('Selected trades for execution:', trades);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Trading Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-300 text-sm">Account Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">$10,000.00</div>
              <p className="text-xs text-gray-400">Available for trading</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-300 text-sm">Active Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{selectedTrades.length}</div>
              <p className="text-xs text-gray-400">Positions open</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-300 text-sm">Watchlist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{watchlistSymbols.length}</div>
              <p className="text-xs text-gray-400">Symbols tracked</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-300 text-sm">Total P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">$0.00</div>
              <p className="text-xs text-gray-400">Realized + Unrealized</p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="signals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800">
            <TabsTrigger value="signals" className="text-white">Signal Generator</TabsTrigger>
            <TabsTrigger value="potential" className="text-white">High Potential</TabsTrigger>
            <TabsTrigger value="ticker" className="text-white">Live Ticker</TabsTrigger>
            <TabsTrigger value="active" className="text-white">Active Trades</TabsTrigger>
            <TabsTrigger value="history" className="text-white">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signals">
            <SignalGenerator />
          </TabsContent>
          
          <TabsContent value="potential">
            <HighPotentialTrades 
              onSymbolsUpdate={handleSymbolsUpdate}
              onTradesSelected={handleTradesSelected}
            />
          </TabsContent>
          
          <TabsContent value="ticker">
            <AdvancedMarketTicker />
          </TabsContent>
          
          <TabsContent value="active">
            <ActiveTrades />
          </TabsContent>
          
          <TabsContent value="history">
            <TradeHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;