import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface SymbolSelectorProps {
  selectedSymbol: string;
  onSymbolChange: (symbol: string) => void;
  highPotentialSymbols: string[];
  onLoadHighPotentialSymbols: () => void;
}

const SymbolSelector: React.FC<SymbolSelectorProps> = ({
  selectedSymbol,
  onSymbolChange,
  highPotentialSymbols,
  onLoadHighPotentialSymbols
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [watchlist, setWatchlist] = useState<string[]>(['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN']);
  const [showSearch, setShowSearch] = useState(false);

  const popularSymbols = ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'NFLX', 'AMD', 'CRM'];
  
  const filteredSymbols = popularSymbols.filter(symbol => 
    symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToWatchlist = (symbol: string) => {
    if (!watchlist.includes(symbol)) {
      setWatchlist(prev => [...prev, symbol]);
    }
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(prev => prev.filter(s => s !== symbol));
  };

  const handleSymbolSelect = (symbol: string) => {
    onSymbolChange(symbol);
    addToWatchlist(symbol);
    setShowSearch(false);
    setSearchTerm('');
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Current Symbol */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Current Symbol:</span>
              <Badge className="bg-blue-600">{selectedSymbol}</Badge>
            </div>
            <Button
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
              variant="outline"
            >
              🔍 Search
            </Button>
          </div>

          {/* Search Interface */}
          {showSearch && (
            <div className="space-y-3">
              <Input
                placeholder="Search symbols (e.g., AAPL, TSLA)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
              {searchTerm && (
                <div className="flex flex-wrap gap-2">
                  {filteredSymbols.map(symbol => (
                    <Button
                      key={symbol}
                      size="sm"
                      variant="outline"
                      onClick={() => handleSymbolSelect(symbol)}
                      className="text-xs"
                    >
                      {symbol}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Watchlist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Watchlist:</span>
              <Select value={selectedSymbol} onValueChange={onSymbolChange}>
                <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {watchlist.map(symbol => (
                    <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              {watchlist.map(symbol => (
                <div key={symbol} className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant={selectedSymbol === symbol ? "default" : "outline"}
                    onClick={() => onSymbolChange(symbol)}
                    className="text-xs"
                  >
                    {symbol}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFromWatchlist(symbol)}
                    className="text-xs text-red-400 hover:text-red-300 p-1"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* High Potential Symbols Button */}
          <div className="pt-2 border-t border-gray-700">
            <Button
              onClick={onLoadHighPotentialSymbols}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              🔥 Load High Potential Trade Symbols ({highPotentialSymbols.length})
            </Button>
            {highPotentialSymbols.length > 0 && (
              <div className="mt-2 text-xs text-gray-400">
                Available: {highPotentialSymbols.join(', ')}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SymbolSelector;