// src/components/BuySellModule/index.tsx

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

import { useUser } from '@supabase/auth-helpers-react';
import {
  getAlpacaPrice,
  getUserAlpacaKeys,
  placeAlpacaOrder,
} from '@/lib/alpaca';
import { updateClosedTrades } from '@/lib/updateClosedTrades';

import MarketOrderForm from './MarketOrderForm';
import LimitOrderForm from './LimitOrderForm';
import StopOrderForm from './StopOrderForm';
import StopLimitOrderForm from './StopLimitOrderForm';
import TrailingStopForm from './TrailingStopForm';
import EstimatedCost from './EstimatedCost';
import ReviewOrderModal from './ReviewOrderModal';

import { useAppContext } from '@/contexts/AppContext';
import type { OrderSide, OrderType, TimeInForce } from './types';

interface BuySellModuleProps {
  setLastOrderResponse: (data: any) => void;
  fetchSymbols: () => Promise<any>;
}

const BuySellModule: React.FC<BuySellModuleProps> = ({
  setLastOrderResponse,
  fetchSymbols,
}) => {
  const user = useUser();
  const { account, positions } = useAppContext(); // WebSocket-driven state

  const [symbol, setSymbol] = useState('');
  const [price, setPrice] = useState<number | null>(null);
  const [qty, setQty] = useState<number>(0);
  const [side, setSide] = useState<OrderSide>('buy');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [timeInForce, setTimeInForce] = useState<TimeInForce>('day');

  const [limitPrice, setLimitPrice] = useState<number | null>(null);
  const [stopPrice, setStopPrice] = useState<number | null>(null);
  const [trailValue, setTrailValue] = useState<number | null>(null);
  const [trailType, setTrailType] = useState<'rate' | 'price'>('rate');

  const [showModal, setShowModal] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Fetch current price whenever symbol changes
  useEffect(() => {
    const fetchPrice = async () => {
      if (symbol.length >= 1 && symbol.length <= 5 && user?.id) {
        const keys = await getUserAlpacaKeys(user.id);
        if (!keys) return;

        const fetched = await getAlpacaPrice(symbol, keys.api_key, keys.secret_key);
        setPrice(fetched);
      }
    };
    fetchPrice();
  }, [symbol, user]);

  // ---- Post-order execution ----
  const handleConfirmOrder = async () => {
    if (!user?.id || !symbol || qty <= 0) {
      setOrderError('Missing required fields.');
      return;
    }

    setIsPlacingOrder(true);
    setOrderError(null);

    try {
      const keys = await getUserAlpacaKeys(user.id);
      if (!keys) throw new Error('Missing API credentials.');

      let response;

      switch (orderType) {
        case 'market':
          response = await placeAlpacaOrder(symbol, qty, side, 'market', timeInForce, keys.api_key, keys.secret_key);
          break;

        case 'limit':
          if (!limitPrice) throw new Error('Missing limit price.');
          response = await placeAlpacaOrder(
            symbol, qty, side, 'limit', timeInForce,
            keys.api_key, keys.secret_key, { limit_price: limitPrice }
          );
          break;

        case 'stop':
          if (!stopPrice) throw new Error('Missing stop price.');
          response = await placeAlpacaOrder(
            symbol, qty, side, 'stop', timeInForce,
            keys.api_key, keys.secret_key, { stop_price: stopPrice }
          );
          break;

        case 'stop_limit':
          if (!limitPrice || !stopPrice) throw new Error('Missing stop or limit price.');
          response = await placeAlpacaOrder(
            symbol, qty, side, 'stop_limit', timeInForce,
            keys.api_key, keys.secret_key, { stop_price: stopPrice, limit_price: limitPrice }
          );
          break;

        case 'trailing_stop':
          if (!trailValue) throw new Error('Missing trail value.');
          const trailKey = trailType === 'rate' ? 'trail_percent' : 'trail_price';
          response = await placeAlpacaOrder(
            symbol, qty, side, 'trailing_stop', timeInForce,
            keys.api_key, keys.secret_key, { [trailKey]: trailValue }
          );
          break;

        default:
          throw new Error('Unsupported order type.');
      }

      console.log('Order placed:', response);
      setLastOrderResponse(response);

      if (user?.id) {
        try {
          await updateClosedTrades(user.id); // WebSocket keeps account/positions updated
        } catch (err) {
          console.error('Post-order refresh failed:', err);
        }
      }

      setShowModal(false);
      setSymbol('');
      setQty(0);
    } catch (err: any) {
      console.error('Order error:', err.message || err);
      setOrderError(err.message || 'Order failed.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-[#1a1a1a] text-white rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            className={`bg-black text-white border border-white ${side === 'buy' ? 'font-bold' : ''}`}
            onClick={() => setSide('buy')}
          >
            Buy
          </Button>
          <Button
            variant="ghost"
            className={`bg-black text-white border border-white ${side === 'sell' ? 'font-bold' : ''}`}
            onClick={() => setSide('sell')}
          >
            Sell
          </Button>
        </div>
      </div>

      <Label>Symbol</Label>
      <Input
        value={symbol}
        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        placeholder="AAPL"
        className="bg-black text-white"
      />
      {price !== null && (
        <p className="text-sm text-gray-300">
          Current Market Price: <span className="font-semibold">${price.toFixed(2)}</span>
        </p>
      )}

      <Label>Order Type</Label>
      <Select onValueChange={(val) => setOrderType(val as OrderType)} value={orderType}>
        <SelectTrigger className="bg-black text-white border border-gray-600 rounded-md">
          <SelectValue placeholder="Select order type" />
        </SelectTrigger>
        <SelectContent className="bg-[#2a2a2a] text-white rounded-md shadow-md">
          <SelectItem value="market">Market</SelectItem>
          <SelectItem value="limit">Limit</SelectItem>
          <SelectItem value="stop">Stop</SelectItem>
          <SelectItem value="stop_limit">Stop Limit</SelectItem>
          <SelectItem value="trailing_stop">Trailing Stop</SelectItem>
        </SelectContent>
      </Select>

      {orderType === 'market' && <MarketOrderForm qty={qty} setQty={setQty} />}
      {orderType === 'limit' && (
        <LimitOrderForm
          qty={qty} setQty={setQty}
          limitPrice={limitPrice} setLimitPrice={setLimitPrice}
        />
      )}
      {orderType === 'stop' && (
        <StopOrderForm
          qty={qty} setQty={setQty}
          stopPrice={stopPrice} setStopPrice={setStopPrice}
        />
      )}
      {orderType === 'stop_limit' && (
        <StopLimitOrderForm
          qty={qty} setQty={setQty}
          limitPrice={limitPrice} setLimitPrice={setLimitPrice}
          stopPrice={stopPrice} setStopPrice={setStopPrice}
        />
      )}
      {orderType === 'trailing_stop' && (
        <TrailingStopForm
          qty={qty} setQty={setQty}
          trailType={trailType} setTrailType={setTrailType}
          trailValue={trailValue} setTrailValue={setTrailValue}
          stopPrice={stopPrice} setStopPrice={setStopPrice}
          price={price}
        />
      )}

      <Label>Time In Force</Label>
      <Select onValueChange={(val) => setTimeInForce(val as TimeInForce)} value={timeInForce}>
        <SelectTrigger className="bg-black text-white border border-gray-600 rounded-md">
          <SelectValue placeholder="Select TIF" />
        </SelectTrigger>
        <SelectContent className="bg-[#2a2a2a] text-white rounded-md shadow-md">
          <SelectItem value="day">DAY</SelectItem>
          <SelectItem value="gtc">GTC</SelectItem>
          <SelectItem value="fok">FOK</SelectItem>
          <SelectItem value="ioc">IOC</SelectItem>
          <SelectItem value="opg">OPG</SelectItem>
          <SelectItem value="cls">CLS</SelectItem>
        </SelectContent>
      </Select>

      <EstimatedCost
        price={price}
        qty={qty}
        side={side}
        label={side === 'buy' ? 'Estimated Cost' : 'Estimated Value'}
      />

      <Button
        disabled={!symbol || qty <= 0 || !price}
        onClick={() => setShowModal(true)}
      >
        Review Order
      </Button>

      <ReviewOrderModal
        open={showModal}
        onCancel={() => setShowModal(false)}
        onConfirm={handleConfirmOrder}
        isPlacingOrder={isPlacingOrder}
        error={orderError}
        orderDetails={{
          symbol,
          side,
          qty,
          orderType,
          limitPrice,
          stopPrice,
          trailValue,
          trailType,
          price,
          timeInForce,
        }}
      />
    </div>
  );
};

export default BuySellModule;
