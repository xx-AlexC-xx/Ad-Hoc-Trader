TrailingStopForm Component
A React form component for specifying a trailing stop order with inputs for trail type (rate or price), trail value, auto-calculated stop price, and quantity.

Props
Name	Type	Description
qty	number	Quantity of shares to trade
setQty	(qty: number) => void	Setter function to update quantity
trailType	'rate' | 'price'	Type of trailing stop: percentage rate or fixed price
setTrailType	(type: 'rate' | 'price') => void	Setter function to update the trail type
trailValue	number | null	Value of trailing stop (percentage or price)
setTrailValue	(value: number | null) => void	Setter function to update the trail value
stopPrice	number | null	Auto-calculated stop price based on trail value
setStopPrice	(price: number) => void	Setter function to update stop price
price	number | null	Current market price

Features
User can toggle trail type between:

Rate (%) — trailing stop based on percentage of price.

Price ($) — trailing stop based on fixed price difference.

Input for trail value with decimal support.

Automatically calculates and updates stop price when price, trailValue, or trailType changes.

Displays auto-calculated stop price in a disabled input field.

Input for quantity with validation.

Clean layout with spacing and consistent styling.

Behavior
Calculates stop price as:

For 'rate': price - (price * trailValue / 100)

For 'price': price - trailValue

Updates stopPrice state with value rounded to two decimals.

Disables stop price input since it’s auto-calculated.

Usage Example
tsx
Copy
Edit
<TrailingStopForm
  qty={qty}
  setQty={setQty}
  trailType={trailType}
  setTrailType={setTrailType}
  trailValue={trailValue}
  setTrailValue={setTrailValue}
  stopPrice={stopPrice}
  setStopPrice={setStopPrice}
  price={currentPrice}
/>
