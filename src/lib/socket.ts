import { Server } from "socket.io";

let io: Server | null = null;

export const initSocket = (server: any) => {
  if (!io) {
    io = new Server(server, {
      cors: {
        origin: "*",
      },
    });

    io.on("connection", (socket) => {
      const userId = socket.handshake.auth.userId;

      if (!userId) return;

      // join personal room
      socket.join(userId);

      console.log("User connected:", userId);

      socket.on("sendMessage", async (data) => {
        const { chatId, text, receiverId } = data;

        // emit to receiver
        io?.to(receiverId).emit("receiveMessage", {
          chatId,
          text,
          senderId: userId,
        });

        // also emit to sender
        socket.emit("receiveMessage", {
          chatId,
          text,
          senderId: userId,
        });
      });

      socket.on("disconnect", () => {
        console.log("User disconnected");
      });
    });
  }

  return io;
};