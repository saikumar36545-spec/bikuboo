# BIKUBOO — Final MVP

This package includes:
- Supabase login/signup/session persistence
- Publish Ride
- Find Ride
- Passenger ride requests
- My Ride Requests
- Smart Geoapify location autocomplete for cities, areas, roads, landmarks and PIN/postcode results
- Better fallback location suggestions
- Fix for the invisible search-result cards
- Compatibility with the existing `rides` table that requires `from_place` and `to_place`

## 1. IMPORTANT: Fix "No rides available"

If you already published rides but Find Ride says **No matching rides found**, run this file once:

**`FIX_NO_RIDES.sql`**

In Supabase:
1. Open **SQL Editor**.
2. Create a new query.
3. Copy/paste the complete contents of `FIX_NO_RIDES.sql`.
4. Click **Run**.

This adds a SELECT policy for `status = 'open'`, which is the status BIKUBOO uses for published rides. Your existing rides are not deleted.

## 2. Existing rides table setup

If you have not already done so, also run:

**`SETUP_LOCATION_AUTOCOMPLETE.sql`**

This only adds the location columns needed by the app when they are missing.

## 3. Open the app

1. Extract the ZIP.
2. Open the extracted folder.
3. Double-click **`index.html`**.
4. Open Chrome and log in.
5. Go to **Find Ride** and search.

## Location search

The app uses Geoapify Address Autocomplete with an India country filter and searches multiple result types so the suggestions are not limited to city/area names. Geoapify supports `city`, `street`, `amenity`, `locality`, postcode and other location types.

The selected location also stores its place ID and coordinates for future map/routing features.

## Security note

The browser uses the Geoapify client API key. Before public deployment, restrict the key by allowed origins/referrers in Geoapify. Never put a Supabase service-role/secret key in this browser app.


## Current location
The From fields now include **Use current location**. It uses browser GPS permission and Geoapify reverse geocoding to turn the coordinates into a readable address while also storing latitude/longitude for the ride.

## My Rides update
- Drivers can view their own rides, including cancelled rides.
- Drivers can open ride details and cancel a ride.
- Passengers can view accepted rides under Rides I joined.
- Passengers can view ride details and cancel a request.
- Run `SETUP_NEXT.sql` once after this update.

## Real-time notifications

Run `NOTIFICATIONS_SETUP.sql` once in Supabase SQL Editor. It creates the notifications table, RLS policies, database triggers, and enables the table for Supabase Realtime. Then open `index.html` while logged in.

The app shows a notification bell in the header and listens for new notifications without a page refresh. Notifications are created for new ride requests, accepted/rejected requests, and rides becoming full.
