"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface IPersona {
  _id: string;
  name: string;
  avatarEmoji?: string;
}

export default function PersonasPage() {
  const [personas, setPersonas] = useState<IPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api-v2/personas")
      .then((res) => res.json())
      .then((data) => {
        setPersonas(data.personas || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading personas...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Personas</h1>
        <button
          onClick={() => router.push("/personas/new")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
        >
          + Add Persona
        </button>
      </div>

      {/* Personas Grid */}
      {personas.length === 0 ? (
        <p className="text-gray-500">No personas yet. Create one to start chatting.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
          {personas.map((persona) => (
            <div
              key={persona._id}
              onClick={() => router.push(`/personas/${persona._id}`)}
              className="cursor-pointer group bg-white rounded-2xl shadow-sm hover:shadow-lg transition p-6 flex flex-col items-center justify-center border border-gray-100 hover:border-blue-500"
            >
              <div className="text-5xl mb-3 transform group-hover:scale-110 transition">
                {persona.avatarEmoji?.startsWith("http") ? (
                  <img
                    src={persona.avatarEmoji}
                    alt="Avatar"
                    className="w-16 h-16 object-cover rounded-full"
                  />
                ) : (
                  persona.avatarEmoji || "👤"
                )}
              </div>
              <h2 className="text-center text-sm font-medium text-gray-800 truncate">
                {persona.name}
              </h2>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
