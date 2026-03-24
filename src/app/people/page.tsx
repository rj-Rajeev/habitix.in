"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { useSession } from "next-auth/react";

export default function PeoplePage() {
  const [users, setUsers] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { data: session } = useSession();

  // 🔹 Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        setUsers(data);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // 🔹 Socket for online users
  useEffect(() => {
    if (!session?.user?.id) return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      auth: {
        userId: session.user.id,
      },
    });

    socket.on("onlineUsers", (users: string[]) => {
      setOnlineUsers(users);
    });

    // ✅ CORRECT cleanup
    return () => {
      socket.disconnect();
    };
  }, [session]);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="sticky top-0 bg-white border-b px-4 py-3 z-10">
        <h1 className="text-lg font-semibold">People</h1>
        <p className="text-xs text-gray-500">Connect and chat</p>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">

        {loading && (
          <p className="text-center text-gray-400 text-sm">Loading users...</p>
        )}

        {!loading && users.length === 0 && (
          <p className="text-center text-gray-400 text-sm">
            No users found
          </p>
        )}

        {users.map((user) => {
          const isOnline = onlineUsers.includes(user._id);

          return (
            <div
              key={user._id}
              onClick={() => router.push(`/people/${user._id}`)}
              className="flex items-center justify-between bg-white p-3 rounded-lg border hover:bg-gray-100 active:scale-[0.98] transition cursor-pointer"
            >
              {/* Left */}
              <div className="flex items-center gap-3">
                
                {/* Avatar */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>

                  {/* Online indicator */}
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      isOnline ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                </div>

                {/* User Info */}
                <div>
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate max-w-[180px]">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Right */}
              <div className="text-xs text-gray-400">
                {isOnline ? "Online" : "Offline"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}