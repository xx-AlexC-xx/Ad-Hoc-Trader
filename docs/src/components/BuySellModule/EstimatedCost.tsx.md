EstimatedCost Component
A simple React component that calculates and displays the estimated cost or value of an order based on the current price and quantity.

Props
Name	Type	Description
price	number	Current price per unit/share
qty	number	Quantity of shares/units
side	'buy' | 'sell'	Indicates if it's a buy or sell order (currently unused in calculation but can be used for labeling)
label	string	Label to display before the total (e.g., "Estimated Cost" or "Estimated Value")

Behavior
Returns null (renders nothing) if either price or qty is falsy (zero or undefined).

Calculates the total cost/value by multiplying price by qty.

Displays the total formatted as currency with two decimals.

Styles the output with small text, gray color, and white bolded total.

Usage Example
tsx
Copy
Edit
<EstimatedCost price={150.23} qty={10} side="buy" label="Estimated Cost" />
Notes
Currently, the side prop is not used in the calculation but is included for possible future extension (e.g., different formatting or behavior for buy vs sell).

Assumes price and qty are valid positive numbers.