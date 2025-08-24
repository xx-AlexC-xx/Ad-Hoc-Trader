MarketOrderForm Component
A React form component that allows users to input the quantity for a market order. Supports toggling between entering the quantity as shares or dollar amount.

Props
Name	Type	Description
qty	number	Current quantity or dollar amount input
setQty	(qty: number) => void	Setter function to update the quantity or dollar amount

Features
Two trade modes:

Shares — input is treated as an integer number of shares.

Dollars — input is treated as a floating-point dollar amount.

Toggle buttons to switch between shares and dollars, highlighting the selected mode.

Input validation:

If input is invalid or empty, quantity resets to 0.

Shares input is always rounded down to the nearest whole number.

Uses controlled input with dark-themed styling.

Behavior Notes
Changing trade mode does not automatically reset quantity; user input is preserved until changed.

The component calls setQty with either the integer number of shares or dollar amount based on the selected mode.

Usage Example
tsx
Copy
Edit
<MarketOrderForm qty={qty} setQty={setQty} />