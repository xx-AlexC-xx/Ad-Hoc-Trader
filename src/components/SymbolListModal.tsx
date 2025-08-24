import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Symbol = {
  symbol: string;
  name: string;
  exchange: string;
  shortable: boolean;
  marginable: boolean;
  easy_to_borrow: boolean;
  fractionable: boolean;
};

interface SymbolListModalProps {
  onClose: () => void;
  symbols: Symbol[];
}

const SymbolListModal: React.FC<SymbolListModalProps> = ({ onClose, symbols }) => {
  const [search, setSearch] = useState('');
  const [exchangeFilter, setExchangeFilter] = useState('');

  const filteredSymbols = useMemo(() => {
    return symbols.filter((symbol) => {
      const matchesSearch =
        symbol.symbol.toLowerCase().includes(search.toLowerCase()) ||
        symbol.name.toLowerCase().includes(search.toLowerCase());
      const matchesExchange = exchangeFilter
        ? symbol.exchange.toLowerCase() === exchangeFilter.toLowerCase()
        : true;
      return matchesSearch && matchesExchange;
    });
  }, [symbols, search, exchangeFilter]);

  const uniqueExchanges = useMemo(() => {
    const exchanges = symbols.map((s) => s.exchange);
    return Array.from(new Set(exchanges));
  }, [symbols]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a1a] text-white max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Trade Symbols</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mt-4 space-y-2 md:space-y-0">
          <Input
            placeholder="Search by symbol or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-1/2 bg-[#0f0f0f] text-white"
          />
          <select
            value={exchangeFilter}
            onChange={(e) => setExchangeFilter(e.target.value)}
            className="w-full md:w-1/3 bg-[#0f0f0f] text-white border border-gray-600 p-2 rounded"
          >
            <option value="">All Exchanges</option>
            {uniqueExchanges.map((ex, idx) => (
              <option key={idx} value={ex}>
                {ex}
              </option>
            ))}
          </select>
          <Button variant="destructive" onClick={onClose} className="self-start md:self-auto">
            Close
          </Button>
        </div>

        <div className="mt-6">
          {filteredSymbols.length === 0 ? (
            <p className="text-gray-400 text-sm">No matching symbols found.</p>
          ) : (
            <table className="w-full text-sm mt-2 border border-gray-700 rounded overflow-hidden">
              <thead className="bg-[#2a2a2a]">
                <tr>
                  <th className="p-2 text-left">Symbol</th>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Exchange</th>
                  <th className="p-2 text-left">Shortable</th>
                  <th className="p-2 text-left">Marginable</th>
                  <th className="p-2 text-left">Easy to Borrow</th>
                  <th className="p-2 text-left">Fractionable</th>
                </tr>
              </thead>
              <tbody>
                {filteredSymbols.map((s, idx) => (
                  <tr key={idx} className="border-t border-gray-700 hover:bg-[#222]">
                    <td className="p-2">{s.symbol}</td>
                    <td className="p-2">{s.name}</td>
                    <td className="p-2">{s.exchange}</td>
                    <td className="p-2">{s.shortable ? '✔' : '✘'}</td>
                    <td className="p-2">{s.marginable ? '✔' : '✘'}</td>
                    <td className="p-2">{s.easy_to_borrow ? '✔' : '✘'}</td>
                    <td className="p-2">{s.fractionable ? '✔' : '✘'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SymbolListModal;
