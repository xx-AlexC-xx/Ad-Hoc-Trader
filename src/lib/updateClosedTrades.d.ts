// src/lib/updateClosedTrades.d.ts
import { TradeUpsert } from '@/types';

export type AlpacaTrade = TradeUpsert;

export declare function updateClosedTrades(userId: string): Promise<void>;
