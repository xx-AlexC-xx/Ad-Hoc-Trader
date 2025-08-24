Types and Interfaces for Trading Order Components
This module defines union types and interfaces used across the trading order components for type safety and consistent props structure.

Union Types
Type Name	Possible Values	Description
OrderType	'market', 'limit', 'stop', 'stop_limit', 'trailing_stop'	Different order types supported
OrderSide	'buy', 'sell'	Buy or sell side of an order
TimeInForce	'day', 'gtc', 'fok', 'ioc', 'opg', 'cls'	Time in force options for order validity
TrailType	'rate', 'price'	Trailing stop type: percentage rate or fixed price

Interfaces for Component Props
QuantityProps
Props related to quantity input:

ts
Copy
Edit
interface QuantityProps {
  qty: number;
  setQty: (value: number) => void;
}
LimitPriceProps
Props related to limit price input:

ts
Copy
Edit
interface LimitPriceProps {
  limitPrice: number | null;
  setLimitPrice: (value: number | null) => void;
}
StopPriceProps
Props related to stop price input:

ts
Copy
Edit
interface StopPriceProps {
  stopPrice: number | null;
  setStopPrice: (value: number | null) => void;
}
TrailingStopProps
Props for trailing stop form with multiple related fields:

ts
Copy
Edit
interface TrailingStopProps {
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
ReviewOrderModalProps
Props for the order review modal component:

ts
Copy
Edit
interface ReviewOrderModalProps {
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
EstimatedCostProps
Props for the estimated cost display component:

ts
Copy
Edit
interface EstimatedCostProps {
  price: number | null;
  qty: number;
  side: OrderSide;
  label: string;
}
