# BIKUBOO – Live Location Autocomplete

This version uses Geoapify Address Autocomplete for live India location suggestions.

## Test
1. Extract the ZIP.
2. Open `index.html` in Chrome.
3. Log in.
4. Go to Offer a Ride or Find a Ride.
5. Type `Ameerpet`, `Kukatpally`, `Madhapur`, `Banjara Hills`, etc.
6. Select a suggestion from the dropdown.

The selected location stores its formatted name and, when returned by Geoapify, place ID and latitude/longitude in the ride record.

## Important
The Geoapify browser API key is included because this is a client-side MVP. In the Geoapify project settings, restrict the key to the domains/origins used by BIKUBOO before public deployment and rotate the key if you ever expose it unintentionally.

The BIKUBOO Supabase URL and publishable key remain client-side values; never put a Supabase secret/service-role key in this project.
