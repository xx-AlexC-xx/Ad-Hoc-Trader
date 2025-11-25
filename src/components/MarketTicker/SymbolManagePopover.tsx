// src/components/MarketTicker/SymbolManagerPopover.tsx
import React, { useState } from "react";
import { Settings, X, Plus } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMarketStore } from "@/store/MarketStore";

interface SymbolManagerPopoverProps {
  userId?: string;
}

const SymbolManagePopover: React.FC<SymbolManagerPopoverProps> = ({ userId }) => {
  const [newSymbol, setNewSymbol] = useState("");

  const quotes = useMarketStore((s) => s.quotes);
  const subscribeSymbol = useMarketStore((s) => s.subscribeSymbol);
  const unsubscribeSymbol = useMarketStore((s) => s.unsubscribeSymbol);

  const symbols = Object.keys(quotes);

  const handleAddSymbol = () => {
    const trimmed = newSymbol.trim().toUpperCase();
    if (!trimmed || symbols.includes(trimmed)) return;
    subscribeSymbol(trimmed);
    setNewSymbol("");
  };

  const handleRemoveSymbol = (symbol: string) => {
    unsubscribeSymbol(symbol);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" title="Manage Symbols">
          <Settings className="h-5 w-5 text-gray-300 hover:text-white" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 bg-gray-900/95 border border-gray-700 text-gray-200 shadow-lg rounded-md p-4 z-[9999]"
      >
        <h3 className="text-sm font-semibold text-gray-100 mb-3">
          Manage Symbols
        </h3>

        {/* Add Symbol */}
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Enter symbol (e.g. AAPL)"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            className="bg-gray-800 text-white border-gray-700"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={handleAddSymbol}
            disabled={!newSymbol.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Current Symbols List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {symbols.length === 0 ? (
            <p className="text-xs text-gray-400">No symbols added yet.</p>
          ) : (
            symbols.map((sym) => (
              <div
                key={sym}
                className="flex items-center justify-between bg-gray-800/80 rounded-md p-2"
              >
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600 text-white">{sym}</Badge>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="hover:bg-red-700/30"
                  onClick={() => handleRemoveSymbol(sym)}
                >
                  <X className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SymbolManagePopover;
