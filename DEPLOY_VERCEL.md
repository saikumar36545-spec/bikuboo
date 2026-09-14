# BIKUBOO Production Launch

## 1. Deploy the website

Recommended flow:
1. Create a GitHub repository, e.g. `bikuboo-web`.
2. Upload the contents of this folder to the repository root.
3. In Vercel, choose **Add New → Project** and import the GitHub repository.
4. Framework preset: **Other** (static site).
5. Build command: leave empty.
6. Output directory: `.`
7. Deploy.

You can also deploy the folder with the Vercel CLI using `vercel` and then `vercel --prod`.

## 2. Add your domain

In Vercel → Project → Settings → Domains, add your domain and follow the DNS instructions. Vercel will provide HTTPS automatically after DNS is configured.

## 3. PWA

The app includes `manifest.webmanifest`, icons, and `sw.js`. PWA installation requires HTTPS (localhost is also allowed for local development). Do not test installation from a `file://` URL.

## 4. Supabase production settings

In Supabase:
- Add your final website URL to Authentication → URL Configuration → Site URL.
- Add the final website URL to Redirect URLs if you use redirect-based auth flows.
- Run Security Advisor and fix any high-risk findings.
- Keep RLS enabled on all exposed tables.
- Keep service-role/secret keys out of browser code.
- Enable SSL enforcement and consider network restrictions for production.
- Protect your Supabase account with MFA.

## 5. Razorpay

Use Test Mode until the complete UPI + Cash flow is verified. Keep `RAZORPAY_KEY_SECRET` and webhook secrets only in Supabase Edge Function secrets. Never put them in `index.html` or `app.js`.

Before Live Mode, configure your live webhook URL and verify payment signatures server-side.

## 6. Geoapify

The browser needs the Geoapify client key for autocomplete, reverse geocoding and map tiles. Before launch, restrict the Geoapify key to your production domain in the Geoapify dashboard if your plan supports domain restrictions.

## 7. Final smoke test

Test with two separate accounts:
- Passenger account
- Driver account

Test: signup/login → profile → publish ride → find ride → request → accept → UPI/Cash → chat → OTP → start → complete → rating → notification → cancellation/error cases.

Do not switch payment credentials to Live Mode until the test flow is clean.
