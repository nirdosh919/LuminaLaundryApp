# Customer Panel integration checklist

## Customer journeys
- [ ] Home → service category → service details
- [ ] Add service to cart, increment/decrement quantity, remove item
- [ ] Select saved address or create one
- [ ] Load pickup slots from Laravel
- [ ] Submit booking to the real authenticated customer endpoint
- [ ] Display server-returned order ID and total
- [ ] Refresh order list and order details from backend
- [ ] Cancel only when the backend permits it
- [ ] Profile loads authenticated user and logs out through the shared auth module

## API contract must be verified
The previous project audit noted that `/api/mobile/addresses` was not found. Do not assume that route exists. Run `php artisan route:list --path=mobile` in the correct Laravel backend copy and map each adapter function to an actual route. Also check `bootstrap/app.php` to confirm API route registration.

## Security
- Never put Laravel credentials or payment secrets in `EXPO_PUBLIC_*`.
- Use the existing secure token storage and shared authenticated API client.
- Enforce customer ownership and role authorization server-side.
- Do not trust client-side prices; backend must calculate the final total.
- Do not present demo/local bookings as real orders.
