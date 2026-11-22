# SkillSwap frontend

React and Vite frontend for the PeerSkillExchange backend. The source lives in this repository; the Spring Boot API lives in `Tanuj-02/peerskillexchange`.

## Local development

1. Run the backend on port 8080, or set `VITE_BACKEND_URL` to its local origin.
2. Run `npm ci` and `npm run dev`.
3. Vite proxies `/api` to the backend. Do not put credentials in Vite environment variables; they are embedded in browser code.

## Deployment configuration

Set `VITE_API_URL` to the public backend origin **before** `npm run build`. The production client uses same-origin `/api` when this variable is absent, so a separate frontend deployment needs this setting or a hosting rewrite. Whiteboard rooms use `/ws/websocket` for live events; the reverse proxy must forward WebSocket upgrades. Chat still uses REST polling. CORS and allowed origins must be configured on the backend separately.

## Checks

Run `npm test`, `npm run lint`, and `npm run build`. The Node tests cover request payloads, chat message ordering, and whiteboard projection replay. Browser and live backend checks still need a running isolated environment.

## Live whiteboard recovery

The room page loads the versioned board projection from `GET /api/rooms/{id}/board`, then fetches operations after that sequence before opening the live socket. Reconnects catch up from the last contiguous sequence and deduplicate operation IDs. During an API 503 recovery response, drawing is disabled and the page retries. An uncertain save retains its UUID so the **Retry pending change** button is idempotent. The backend's Kafka and Redis setup is documented in `docs/redis-kafka-whiteboard.md` in the API repository.

## Foundation scope

- Signup and login hydrate the current user before opening protected pages. A 401 clears the session.
- Exchange requests send `canTeach` and `wantToLearn` and display the selections saved on each request. Incoming and sent requests have separate views.
- Chat waits for a saved message before displaying it, deduplicates later poll results, ignores responses from another conversation, and restores a failed draft.
- Password change sends the current password, new password, and verification code in a JSON request body. The paired backend now accepts this contract.
- The paired backend allows a new request after a rejected request while preventing another active request.

## AI notes for closed rooms

Open a closed learning room from **Learning rooms** to review its saved board and request AI-generated learning notes. The panel polls while the separate backend worker runs, displays a summary and three practice questions, and permits a report or a limited regeneration. Configure `GROQ_API_KEY` on the backend worker, not in Vite or browser environment variables. See the backend `docs/ai-session-summary.md` for API and worker setup.
