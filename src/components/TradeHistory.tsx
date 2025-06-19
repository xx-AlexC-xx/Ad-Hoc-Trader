import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppContext } from '@/contexts/AppContext';

const TradeHistory: React.FC = () => {
  const { activeTrades } = useAppContext();
  const closedTrades = activeTrades.filter(trade => trade.status === 'closed');

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Trade History</CardTitle>
      </CardHeader>
      <CardContent>
        {closedTrades.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No trades completed yet</p>
            <p className="text-sm text-gray-500">Execute trades to see history</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Symbol</TableHead>
                  <TableHead className="text-gray-300">Entry</TableHead>
                  <TableHead className="text-gray-300">Exit</TableHead>
                  <TableHead className="text-gray-300">P&L</TableHead>
                  <TableHead className="text-gray-300">Reason</TableHead>
                  <TableHead className="text-gray-300">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {closedTrades.map((trade) => {
                  const pnl = trade.pnl || 0;
                  
                  return (
                    <TableRow key={trade.id} className="border-gray-700">
                      <TableCell>
                        <Badge className="bg-blue-600">{trade.symbol}</Badge>
                      </TableCell>
                      <TableCell className="text-white">${trade.entryPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-white">${(trade.currentPrice || trade.exitPrice).toFixed(2)}</TableCell>
                      <TableCell className={pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
                      </TableCell>
                      <TableCell>
                        <Badge className={pnl >= 0 ? 'bg-green-600' : 'bg-red-600'}>
                          {trade.exitReason || 'manual'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {trade.exitTime ? new Date(trade.exitTime).toLocaleDateString() : '--'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TradeHistory;