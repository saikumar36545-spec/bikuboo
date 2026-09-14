# BIKUBOO UPI + Cash Payment Update

## What changed
- UPI is the primary payment option.
- Razorpay Checkout opens directly on a UPI-focused block.
- Cash is an alternative payment method.
- Cash selection creates a secure `cash_pending` transaction.
- The driver confirms cash received from Requests.
- Existing Razorpay payment verification remains server-side.

## Supabase
Run the updated `PAYMENTS_SETUP.sql` in SQL Editor. It is safe to run on an existing `payment_transactions` table because it uses `ADD COLUMN IF NOT EXISTS` and upgrades the status constraint.

## Edge Functions
Deploy these functions in addition to the existing payment functions:
- `choose-cash-payment`
- `confirm-cash-payment`

## Flow
Passenger: Accepted ride -> Pay -> UPI or Cash -> Booking confirmation.
Driver: Requests -> accepted passenger -> Confirm cash received (only when cash was selected).
