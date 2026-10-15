# Habitix Socket.IO authentication configuration

The Habitix application issues short-lived socket tokens after validating a server-side NextAuth session. Configure these values only in the Habitix server environment; never use `NEXT_PUBLIC_*` names or expose them to browser code.

- `SOCKET_TOKEN_PRIVATE_KEY`: RSA private key in PKCS#8 PEM format, with a modulus of at least 2048 bits. Literal `\n` sequences are accepted in place of newlines. The matching SPKI public key is configured on the Socket.IO server.
- `SOCKET_TOKEN_ISSUER`: non-empty issuer string; must exactly match the socket server's `SOCKET_TOKEN_ISSUER`.
- `SOCKET_TOKEN_AUDIENCE`: non-empty audience string; must exactly match the socket server's `SOCKET_TOKEN_AUDIENCE`.
- `SOCKET_INTERNAL_API_TOKEN`: dedicated high-entropy server-to-server bearer credential, at least 32 UTF-8 bytes. It must match the socket server's `SOCKET_INTERNAL_API_TOKEN` and remain separate from NextAuth secrets and JWT keys.

`POST /api/socket/token` returns an RS256 JWT with `sub`, `iss`, `aud`, integer `iat` and `exp`, and a non-empty `jti`. Its lifetime is five minutes. The endpoint derives `sub` from the authenticated NextAuth session.

`POST /api/internal/socket/authorize` accepts only `sendMessage` and `typing`, authenticates the bearer credential, verifies the claimed user is a participant in the requested two-person chat, and derives the recipient from that chat. `sendMessage` requires the persisted `messageId` and exact persisted text; the API returns `textMatches: true` only after verifying both against that sender and chat. `typing` accepts neither field. Existing chats have no connection-request acceptance state, so this compatibility authorization does not enforce pending or declined requests.
