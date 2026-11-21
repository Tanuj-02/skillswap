# SkillSwap frontend

React and Vite frontend for the PeerSkillExchange backend. The source lives in this repository; the Spring Boot API lives in `Tanuj-02/peerskillexchange`.

## Local development

1. Run the backend on port 8080, or set `VITE_BACKEND_URL` to its local origin.
2. Run `npm ci` and `npm run dev`.
3. Vite proxies `/api` to the backend. Do not put credentials in Vite environment variables; they are embedded in browser code.

## Deployment configuration

Set `VITE_API_URL` to the public backend origin **before** `npm run build`. The production client uses same-origin `/api` when this variable is absent, so a separate frontend deployment needs this setting or a hosting rewrite. There is no WebSocket client in the current frontend; chat uses REST polling. CORS and allowed origins must be configured on the backend separately.

## Checks

Run `npm test`, `npm run lint`, and `npm run build`. The Node tests cover request payloads and chat message ordering. Browser and live backend checks still need a running isolated environment.

## Foundation scope

- Signup and login hydrate the current user before opening protected pages. A 401 clears the session.
- Exchange requests send `canTeach` and `wantToLearn` and display the selections saved on each request. Incoming and sent requests have separate views.
- Chat waits for a saved message before displaying it, deduplicates later poll results, ignores responses from another conversation, and restores a failed draft.
- Password change sends the current password, new password, and verification code in a JSON request body. The paired backend now accepts this contract.
- The paired backend allows a new request after a rejected request while preventing another active request.
