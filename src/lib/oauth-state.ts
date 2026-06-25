// Shared constant for the Google OAuth CSRF `state` cookie.
//
// Lives in lib (not the route file) because Next.js route segments may only
// export HTTP handlers + segment config — any other export from a route.ts
// fails the build with "is not a valid Route export field".
export const GOOGLE_OAUTH_STATE_COOKIE = "g_oauth_state";
