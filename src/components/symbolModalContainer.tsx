import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SymbolData {
  symbol: string;
  name: string;
  exchange: string;
}

interface SymbolListModalProps {
  onClose: () => void;
  symbols: SymbolData[];
}

const SymbolListModal: React.FC<SymbolListModalProps> = ({ onClose, symbols }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSymbols, setFilteredSymbols] = useState<SymbolData[]>(symbols);

  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    const filtered = symbols.filter((item) =>
      item.symbol.toLowerCase().includes(lower) ||
      item.name.toLowerCase().includes(lower) ||
      item.exchange.toLowerCase().includes(lower)
    );
    setFilteredSymbols(filtered);
  }, [searchTerm, symbols]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0a] text-white max-h-[90vh] overflow-y-auto rounded-xl border border-gray-800 shadow-xl w-full max-w-4xl">
        <Card className="bg-[#1a1a1a] text-white">
          <CardHeader>
            <CardTitle className="text-white text-xl">Trade Symbols</CardTitle>
          </CardHeader>

          <CardContent>
            {/* Search */}
            <div className="flex items-center mb-4 space-x-2">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by symbol, name, or exchange..."
                className="flex-1 bg-[#0a0a0a] text-white border border-gray-700"
              />
              <Button
                variant="outline"
                className="bg-[#2a2a2a] text-white border border-gray-600 hover:bg-[#3a3a3a]"
                onClick={() => setSearchTerm('')}
              >
                Clear
              </Button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-[60vh] border border-gray-700 rounded-md">
              <table className="min-w-full table-auto text-sm text-left">
                <thead className="bg-[#151515] text-white border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-2">Symbol</th>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Exchange</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSymbols.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-gray-400 text-center">
                        No results found.
                      </td>
                    </tr>
                  ) : (
                    filteredSymbols.map((item) => (
                      <tr key={item.symbol} className="hover:bg-[#2a2a2a]">
                        <td className="px-4 py-2 font-medium">{item.symbol}</td>
                        <td className="px-4 py-2">{item.name}</td>
                        <td className="px-4 py-2">{item.exchange}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default SymbolListModal;
