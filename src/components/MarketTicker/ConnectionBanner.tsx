// src/components/MarketTicker/ConnectionBanner.tsx
import React from 'react';
import { useMarketStore } from '@/store/MarketStore';

const ConnectionBanner: React.FC = () => {
  const status = useMarketStore(s => s.connectionStatus);
  if (status === 'connected') return <div className="text-sm text-green-400">● Live</div>;
  if (status === 'reconnecting') return <div className="text-sm text-yellow-400">● Reconnecting…</div>;
  if (status === 'error') return <div className="text-sm text-red-400">● Connection error</div>;
  return <div className="text-sm text-gray-400">● Offline</div>;
};

export default ConnectionBanner;
