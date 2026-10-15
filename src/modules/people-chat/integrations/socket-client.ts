import { io, type Socket } from "socket.io-client";

const MAX_RECONNECTION_ATTEMPTS = 3;
const TOKEN_LIFETIME_SECONDS = 5 * 60;

type SocketTokenResponse = {
  token: string;
  expiresIn: number;
  expiresAt: string;
};

export type PeopleChatSocketConnection = {
  socket: Socket;
  connect: () => void;
  disconnect: () => void;
};

async function fetchSocketToken(): Promise<string> {
  const response = await fetch("/api/socket/token", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) throw new Error("Socket authentication is unavailable");

  const result = (await response.json()) as Partial<SocketTokenResponse>;
  if (
    typeof result.token !== "string" ||
    !result.token ||
    typeof result.expiresIn !== "number" ||
    result.expiresIn <= 0 ||
    result.expiresIn > TOKEN_LIFETIME_SECONDS ||
    typeof result.expiresAt !== "string" ||
    !Number.isFinite(Date.parse(result.expiresAt))
  ) {
    throw new Error("Socket authentication response is invalid");
  }

  return result.token;
}

export async function createPeopleChatSocket(): Promise<PeopleChatSocketConnection> {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (!socketUrl) throw new Error("Socket service is unavailable");

  const token = await fetchSocketToken();
  const socket = io(socketUrl, {
    autoConnect: false,
    auth: { token },
    reconnectionAttempts: MAX_RECONNECTION_ATTEMPTS,
  });

  let closed = false;
  let refreshingToken = false;
  let failedRefreshes = 0;

  socket.on("connect", () => {
    failedRefreshes = 0;
  });

  socket.on("connect_error", (error) => {
    // Socket.IO marks middleware rejections inactive. Refresh once per failed
    // connection cycle, then wait for a successful connection before retrying.
    if (
      closed ||
      socket.active ||
      error.message !== "Unauthorized" ||
      refreshingToken ||
      failedRefreshes >= 1
    ) {
      return;
    }

    refreshingToken = true;
    failedRefreshes += 1;
    void fetchSocketToken()
      .then((freshToken) => {
        if (closed) return;
        socket.auth = { token: freshToken };
        socket.connect();
      })
      .catch(() => {
        if (!closed) socket.disconnect();
      })
      .finally(() => {
        refreshingToken = false;
      });
  });

  return {
    socket,
    connect: () => {
      if (!closed) socket.connect();
    },
    disconnect: () => {
      closed = true;
      socket.removeAllListeners();
      socket.disconnect();
    },
  };
}
