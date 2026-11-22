# Video call room

The `video-call` branch places the collaborative whiteboard beside a two-person WebRTC call. Members can mute, disable camera, replace the camera track with a screen share, leave, or end the call. Each video tile has a full screen button; the partner video can be expanded while they share their screen. The board supports pen, eraser, rectangle, ellipse, line, arrow, text, and clear. Saves appear locally immediately and remain visibly pending until confirmed.

The room owner can restart a closed room from the room list or its review screen. Restarting keeps the saved board and past calls. The other member's closed-room screen checks for reopening and returns to the live room automatically.

Call notes can be typed or captured through an opt-in browser speech recognition feature. The app does not record media. Browser speech services may process audio. After a call ends, its saved notes can be sent to the existing Groq worker to create a call-specific AI summary and practice questions. Speech that was not saved is absent from the AI input.

For deployment, set `VITE_API_URL` to the API origin and `VITE_WEBRTC_ICE_SERVERS` to a JSON array of STUN/TURN server settings. TURN is needed for reliable connectivity across restrictive networks. Use short-lived TURN credentials; frontend environment values are public after build. Camera and screen capture require HTTPS outside localhost. See the backend's `docs/video-call-room.md` for API routes, migration, and verification evidence.
