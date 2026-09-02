# Data and Authentication

`src/lib/api.ts` defines API response models and the generic `api<T>` fetch helper. It attaches the bearer token and clears invalid authentication after HTTP 401 responses.

`src/lib/auth.ts` owns the reactive `authToken` and `isAuthenticated` state. `setToken` and `clearToken` synchronize state with the `radar-token` local-storage key.

The router reads reactive authentication state before protected navigation. Login remains public; grids and administration require a token.
