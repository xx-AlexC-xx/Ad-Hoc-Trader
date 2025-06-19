import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

interface Trade {
  id: string;
  symbol: string;
  strike_price?: number;
  entry_price: number;
  exit_price?: number;
  stop_loss?: number;
  expiration?: string;
  risk_reward_ratio?: string;
  projected_gain?: number;
  category?: string;
  status: 'pending' | 'active' | 'closed';
  current_price?: number;
  pnl?: number;
  entry_time?: string;
  exit_time?: string;
  exit_reason?: 'target' | 'stop-loss' | 'expiration';
  created_at?: string;
  updated_at?: string;
}

export const useTradeDatabase = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);

  const saveTrade = async (trade: Omit<Trade, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trades')
        .insert([{
          symbol: trade.symbol,
          strike_price: trade.strike_price,
          entry_price: trade.entry_price,
          exit_price: trade.exit_price,
          stop_loss: trade.stop_loss,
          expiration: trade.expiration,
          risk_reward_ratio: trade.risk_reward_ratio,
          projected_gain: trade.projected_gain,
          category: trade.category,
          status: trade.status,
          current_price: trade.current_price,
          pnl: trade.pnl,
          entry_time: trade.entry_time,
          exit_time: trade.exit_time,
          exit_reason: trade.exit_reason
        }])
        .select();

      if (error) throw error;
      
      toast({
        title: "Trade Saved",
        description: `Trade for ${trade.symbol} saved to database`,
      });
      
      return data?.[0];
    } catch (error) {
      console.error('Error saving trade:', error);
      toast({
        title: "Error",
        description: "Failed to save trade to database",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTrade = async (id: string, updates: Partial<Trade>) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('trades')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      await fetchTrades();
    } catch (error) {
      console.error('Error updating trade:', error);
      toast({
        title: "Error",
        description: "Failed to update trade",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTrades(data || []);
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  return {
    trades,
    loading,
    saveTrade,
    updateTrade,
    fetchTrades
  };
};