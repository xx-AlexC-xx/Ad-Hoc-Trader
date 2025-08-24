StopOrderForm Component
A React form component for specifying a stop order with inputs for quantity and stop price.

Props
Name	Type	Description
qty	number	Quantity of shares to trade
setQty	(qty: number) => void	Setter function to update quantity
stopPrice	number | null	Stop price at which the order triggers
setStopPrice	(price: number | null) => void	Setter function to update stop price

Features
Inputs for quantity and stop price with basic validation:

Quantity cannot be negative.

Stop price supports decimal input with two decimal places.

Controlled inputs with placeholder examples.

Simple, vertical layout with spacing between fields.

Uses standard Label and Input UI components.

Usage Example
tsx
Copy
Edit
<StopOrderForm
  qty={qty}
  setQty={setQty}
  stopPrice={stopPrice}
  setStopPrice={setStopPrice}
/>
