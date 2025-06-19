import React, { useState } from 'react';
import Header from './Header';
import Dashboard from './Dashboard';
import Footer from './Footer';

interface TradeSignal {
  symbol: string;
  strikePrice: number;
  expiration: string;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
}

interface ExecutedTrade extends TradeSignal {
  executedAt: Date;
}

const AppLayout: React.FC = () => {
  const [executedTrades, setExecutedTrades] = useState<ExecutedTrade[]>([]);

  const handleTradeExecuted = (trade: TradeSignal) => {
    const executedTrade: ExecutedTrade = {
      ...trade,
      executedAt: new Date()
    };
    setExecutedTrades(prev => [executedTrade, ...prev]);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      
      <main className="max-w-7xl mx-auto p-6">
        <Dashboard executedTrades={executedTrades} />
      </main>
      
      <Footer />
    </div>
  );
};

export default AppLayout;