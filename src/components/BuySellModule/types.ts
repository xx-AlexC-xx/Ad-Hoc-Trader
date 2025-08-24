// Enum-style union types for safety
export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
export type OrderSide = 'buy' | 'sell';
export type TimeInForce = 'day' | 'gtc' | 'fok' | 'ioc' | 'opg' | 'cls';
export type TrailType = 'rate' | 'price';

// Shared props for reusable inputs
export interface QuantityProps {
  qty: number;
  setQty: (value: number) => void;
}

export interface LimitPriceProps {
  limitPrice: number | null;
  setLimitPrice: (value: number | null) => void;
}

export interface StopPriceProps {
  stopPrice: number | null;
  setStopPrice: (value: number | null) => void;
}

export interface TrailingStopProps {
  qty: number;
  setQty: (qty: number) => void;
  trailType: TrailType;
  setTrailType: (val: TrailType) => void;
  trailValue: number | null;
  setTrailValue: (val: number | null) => void;
  stopPrice: number | null;
  setStopPrice: (val: number | null) => void;
  price: number | null;
}

export interface ReviewOrderModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isPlacingOrder: boolean;
  error: string | null;
  orderDetails: {
    symbol: string;
    side: OrderSide;
    qty: number;
    orderType: OrderType;
    limitPrice: number | null;
    stopPrice: number | null;
    trailValue: number | null;
    trailType: TrailType;
    price: number | null;
    timeInForce: TimeInForce;
  };
}

export interface EstimatedCostProps {
  price: number | null;
  qty: number;
  side: OrderSide;
  label: string;
}
