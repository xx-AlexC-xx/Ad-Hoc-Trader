// src/lib/supabase_trades.d.ts
import { TradeUpsert } from '@/types';

export type FetchTradesResponse = TradeUpsert[];

export declare function fetchTradesFromSupabase(userId: string): Promise<FetchTradesResponse>;
