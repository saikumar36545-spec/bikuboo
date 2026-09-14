# BIKUBOO Payments — Razorpay test-mode setup

This update adds a payment-ready booking flow. Real Razorpay secrets are **not** placed in the browser.

## 1. Supabase SQL
Run `PAYMENTS_SETUP.sql` in Supabase SQL Editor.

## 2. Deploy the three Edge Functions
Deploy these folders from the `supabase/functions` directory:
- `create-payment-order`
- `verify-payment`
- `payment-webhook`

## 3. Add Razorpay TEST secrets to Supabase
In Supabase project settings / Edge Function secrets, add:
- `RAZORPAY_KEY_ID` = your Razorpay **Test Mode** Key ID
- `RAZORPAY_KEY_SECRET` = your Razorpay **Test Mode** Key Secret
- `RAZORPAY_WEBHOOK_SECRET` = a webhook secret you choose in Razorpay

Also ensure the standard Supabase function secrets are available (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).

## 4. Razorpay dashboard
Create a Razorpay account and use **Test Mode** first. Configure a webhook pointing to your deployed `payment-webhook` function and enable `payment.captured`, `payment.failed`, and `order.paid` events.

Razorpay requires an order to be created server-side and the payment signature to be verified server-side. Never put the Key Secret in `index.html`.

## 5. Frontend
Open `index.html`. Accepted paid passenger requests show a **Pay ₹...** button. Free rides do not require payment. After successful verified payment, the request shows **Paid**.

The app remains usable without Razorpay keys; the Pay button will explain that test keys are not configured.


## UPI + Cash

BIKUBOO now presents **UPI as the primary payment method**. Razorpay Checkout is configured to land on UPI, using Razorpay-supported UPI flows; UPI Collect/manual VPA entry is not relied on because Razorpay notes that UPI Collect was deprecated for new users from 28 February 2026.

A second option is **Cash**. The passenger can choose Cash after a driver accepts the request. BIKUBOO records the selection as `cash_pending`; the driver then confirms cash received from the Requests screen, changing the transaction to `paid`.

Deploy these additional Edge Functions:
- `choose-cash-payment`
- `confirm-cash-payment`

The passenger never writes payment rows directly from the browser. Cash selection and confirmation are performed through authenticated server-side functions.
