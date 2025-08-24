LimitOrderForm Component
A React form component for specifying a limit order with quantity input and limit price input. Supports toggling between entering quantity in shares or dollars.

Props
Name	Type	Description
qty	number	Quantity of shares or dollar amount depending on input mode
setQty	(qty: number) => void	Setter function to update quantity/dollar amount
limitPrice	number | null	Limit price per share for the order
setLimitPrice	(price: number | null) => void	Setter function to update the limit price

Features
Two input modes:

Shares — user inputs the number of shares.

Dollars — user inputs total dollar amount (still stored in qty prop).

Toggle buttons to switch between input modes, with active mode highlighted.

Input validation for non-negative numbers.

Limit price input with decimal precision to 2 digits.

Styled inputs and labels matching dark-themed UI.

Behavior Notes
Both quantity and dollar inputs update the same qty state prop. Your parent component should interpret this accordingly based on inputMode if needed.

Limit price accepts floating point numbers and converts empty or invalid input to null.

Uses controlled inputs for all fields.

Usage Example
tsx
Copy
Edit
<LimitOrderForm
  qty={qty}
  setQty={setQty}
  limitPrice={limitPrice}
  setLimitPrice={setLimitPrice}
/>