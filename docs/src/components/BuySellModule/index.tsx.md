BuySellModule Component
A React component for placing stock buy/sell orders through Alpaca API with multiple order types supported.

Overview
Enables users to buy or sell stocks by specifying symbol, quantity, order type, and other parameters.

Supports various order types:

Market

Limit

Stop

Stop Limit

Trailing Stop

Fetches current market price for the given symbol.

Uses Alpaca API credentials linked to the authenticated user.

Displays estimated cost or value depending on buy/sell.

Provides a modal for reviewing and confirming orders before placing.

Handles errors and loading states during order placement.

Props
Name	Type	Description
setLastOrderResponse	(data: any) => void	Callback to pass the response of the last placed order.

State Variables
State	Type	Description
symbol	string	Stock ticker symbol input by the user
price	number | null	Current market price fetched from Alpaca API
qty	number	Quantity of shares to buy/sell
side	OrderSide (buy/sell)	Buy or sell side selection
orderType	OrderType	Selected order type (market, limit, stop, etc.)
timeInForce	TimeInForce	Time in force for order execution (day, gtc, etc.)
limitPrice	number | null	Limit price input for limit and stop-limit orders
stopPrice	number | null	Stop price input for stop and stop-limit orders
trailValue	number | null	Trailing stop value (percent or price)
trailType	'rate' | 'price'	Type of trailing stop value (percent or price)
showModal	boolean	Controls visibility of order review modal
isPlacingOrder	boolean	Tracks whether an order is currently being placed
orderError	string | null	Holds error message if order placement fails

External Dependencies
useUser from @supabase/auth-helpers-react for authenticated user context.

API functions:

getUserAlpacaKeys(userId)

getAlpacaPrice(symbol, apiKey, secretKey)

placeAlpacaOrder(...)

UI Components from internal ui library: Input, Button, Label, Select, etc.

Subcomponents handling individual order forms:

MarketOrderForm

LimitOrderForm

StopOrderForm

StopLimitOrderForm

TrailingStopForm

EstimatedCost component to show estimated order cost/value.

ReviewOrderModal component for order confirmation.

Key Functionalities
Fetch Price Effect
On every change of symbol or user, fetches current market price from Alpaca.

Requires a valid user and a symbol length between 1 and 5.

Order Placement (handleConfirmOrder)
Validates inputs (user.id, symbol, qty).

Fetches user API keys.

Calls placeAlpacaOrder with appropriate parameters depending on selected order type:

Market: no extra params

Limit: requires limitPrice

Stop: requires stopPrice

Stop Limit: requires both stopPrice and limitPrice

Trailing Stop: requires trailValue and trailType

Handles errors and displays them.

Resets form on successful order placement.

UI Layout
Side selection buttons (Buy / Sell).

Symbol input with uppercase conversion.

Order type dropdown selector.

Dynamic rendering of order-specific input forms.

Time in Force dropdown.

Estimated cost/value display.

Review Order button that triggers modal.

Order review modal with confirm/cancel and loading/error states.

Usage Example

<BuySellModule setLastOrderResponse={(response) => console.log('Order response:', response)} />
Notes
Assumes Alpaca API credentials are securely stored and retrievable via getUserAlpacaKeys.

Assumes UI components conform to your design system and support styling props.

Handles only client-side validation; backend errors are surfaced and displayed.

