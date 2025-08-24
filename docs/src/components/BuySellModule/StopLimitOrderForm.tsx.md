StopLimitOrderForm Component
A React form component for specifying a stop-limit order with inputs for quantity, stop price, and limit price.

Props
Name	Type	Description
qty	number	Quantity of shares to trade
setQty	(qty: number) => void	Setter function to update quantity
stopPrice	number | null	Stop price at which the stop-limit order triggers
setStopPrice	(price: number | null) => void	Setter function to update stop price
limitPrice	number | null	Limit price to execute the order after stop triggered
setLimitPrice	(price: number | null) => void	Setter function to update limit price

Features
Inputs for quantity, stop price, and limit price with basic validation:

Quantity and prices cannot be negative.

Prices support decimal input with two decimal places.

Controlled inputs with placeholder examples.

Simple, vertical layout with spacing between fields.

Uses standard Label and Input UI components.

Usage Example
tsx
Copy
Edit
<StopLimitOrderForm
  qty={qty}
  setQty={setQty}
  stopPrice={stopPrice}
  setStopPrice={setStopPrice}
  limitPrice={limitPrice}
  setLimitPrice={setLimitPrice}
/>