ReviewOrderModal Component
A React modal dialog that displays a detailed summary of an order for user review and confirmation before submission.

Props
Name	Type	Description
open	boolean	Controls visibility of the modal
onCancel	() => void	Callback triggered when the modal is closed or cancel button is clicked
onConfirm	() => void	Callback triggered when the user confirms the order
isPlacingOrder	boolean	Indicates if an order submission is in progress, disables buttons accordingly
error	string | null	Error message to display if the order submission fails
orderDetails	object	Contains detailed order info (see below)

orderDetails Object Shape
Property	Type	Description
symbol	string	Stock symbol
side	'buy' | 'sell'	Order side
qty	number	Quantity of shares
orderType	string	Order type (market, limit, stop, etc.)
limitPrice	number | null	Limit price (if applicable)
stopPrice	number | null	Stop price (if applicable)
trailValue	number | null	Trailing stop value (if applicable)
trailType	'rate' | 'price'	Trailing stop type (percent or price)
price	number | null	Current market price
timeInForce	string	Time in force value (day, gtc, etc.)

Features
Displays all relevant order details with conditional rendering based on order type.

Shows estimated cost/value calculated from qty * price.

Displays error messages in red if present.

Buttons for cancel and confirm:

Cancel disables modal and resets if clicked.

Confirm triggers order submission.

While order is processing, buttons disable and confirm button shows "Processing...".

Uses Dialog UI component styled with dark theme.

Usage Example
tsx
Copy
Edit
<ReviewOrderModal
  open={isModalOpen}
  onCancel={() => setIsModalOpen(false)}
  onConfirm={handleConfirmOrder}
  isPlacingOrder={isLoading}
  error={orderError}
  orderDetails={{
    symbol: 'AAPL',
    side: 'buy',
    qty: 10,
    orderType: 'limit',
    limitPrice: 150.5,
    stopPrice: null,
    trailValue: null,
    trailType: 'rate',
    price: 151,
    timeInForce: 'day',
  }}
/>
