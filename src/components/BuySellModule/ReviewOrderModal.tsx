import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { ReviewOrderModalProps } from './types';

const ReviewOrderModal: React.FC<ReviewOrderModalProps> = ({
  open,
  onCancel,
  onConfirm,
  isPlacingOrder,
  error,
  orderDetails,
}) => {
  const {
    symbol,
    side,
    qty,
    orderType,
    limitPrice,
    stopPrice,
    trailValue,
    trailType,
    price,
    timeInForce,
  } = orderDetails;

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="bg-[#1a1a1a] text-white">
        <DialogHeader>
          <DialogTitle>Confirm Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          <p><strong>Symbol:</strong> {symbol}</p>
          <p><strong>Side:</strong> {side.toUpperCase()}</p>
          <p><strong>Type:</strong> {orderType}</p>
          <p><strong>Qty:</strong> {qty}</p>
          <p><strong>Time in Force:</strong> {timeInForce.toUpperCase()}</p>

          {orderType === 'limit' && <p><strong>Limit Price:</strong> ${limitPrice?.toFixed(2)}</p>}
          {orderType === 'stop' && <p><strong>Stop Price:</strong> ${stopPrice?.toFixed(2)}</p>}
          {orderType === 'stop_limit' && (
            <>
              <p><strong>Stop Price:</strong> ${stopPrice?.toFixed(2)}</p>
              <p><strong>Limit Price:</strong> ${limitPrice?.toFixed(2)}</p>
            </>
          )}
          {orderType === 'trailing_stop' && (
            <>
              <p><strong>Trail Type:</strong> {trailType.toUpperCase()}</p>
              <p><strong>Trail Value:</strong> {trailValue} {trailType === 'rate' ? '%' : '$'}</p>
              <p><strong>Calculated Stop Price:</strong> ${stopPrice?.toFixed(2)}</p>
            </>
          )}
          {price && (
            <p>
              <strong>Estimated {side === 'buy' ? 'Cost' : 'Value'}:</strong> ${(
                qty * price
              ).toFixed(2)}
            </p>
          )}
        </div>

        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}

        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={onCancel} disabled={isPlacingOrder}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={onConfirm}
            disabled={isPlacingOrder}
          >
            {isPlacingOrder ? 'Processing...' : 'Proceed'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewOrderModal;
