"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface IPersona {
  _id: string;
  name: string;
  avatarEmoji?: string;
  description?: string;
}

export default function PersonasPage() {
  const [personas, setPersonas] = useState<IPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Keep original API call
  useEffect(() => {
    fetch("/api-v2/personas")
      .then((res) => res.json())
      .then((data) => {
        setPersonas(data.personas || []);
        setLoading(false);
      });
  }, []);

  const filteredPersonas = personas.filter(persona =>
    persona.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="group relative">
          <div className="relative bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl animate-pulse">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0"></div>
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-20 h-20 bg-gray-300/50 rounded-full mb-6 flex items-center justify-center"></div>
              <div className="h-6 bg-gray-300/50 rounded-lg w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-300/30 rounded-lg w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-24 relative">
      {/* Floating orbs background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-20 right-20 w-24 h-24 bg-blue-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-indigo-500/10 rounded-full blur-xl animate-pulse delay-500"></div>
      </div>
      
      <div className="relative z-10 text-8xl mb-8 animate-bounce">
        <div className="relative">
          <span className="absolute inset-0 text-8xl blur-sm bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">🤖</span>
          <span className="relative text-8xl">🤖</span>
        </div>
      </div>
      
      <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
        Your AI Universe Awaits
      </h3>
      <p className="text-gray-600 text-center mb-10 max-w-md text-lg leading-relaxed">
        Create your first AI persona and unlock endless possibilities for personalized conversations
      </p>
      
      <button
        onClick={() => router.push("/personas/new")}
        className="group relative bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white px-12 py-4 rounded-2xl font-semibold text-lg shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 transform hover:scale-105 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        <span className="relative flex items-center gap-3">
          <span className="text-2xl group-hover:rotate-180 transition-transform duration-500">✨</span>
          Create Your First Persona
        </span>
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-6 py-12">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-16">
            <div className="h-12 bg-white/10 rounded-2xl w-64 mb-8 lg:mb-0 animate-pulse"></div>
            <div className="h-12 bg-white/10 rounded-2xl w-48 animate-pulse"></div>
          </div>
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Dynamic background elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-16">
          <div className="mb-8 lg:mb-0">
            <h1 className="text-5xl lg:text-7xl font-black mb-6">
              <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent drop-shadow-lg">
                Your AI
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Universe
              </span>
            </h1>
            <p className="text-gray-300 text-xl max-w-md leading-relaxed">
              Choose from your collection of AI personalities, each with unique capabilities and perspectives
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search personas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-3 text-white placeholder-gray-300 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all duration-300 w-full sm:w-64"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </div>
            </div>

            {/* Add Persona Button - Keep original onClick */}
            <button
              onClick={() => router.push("/personas/new")}
              className="group relative bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-2xl font-semibold shadow-2xl hover:shadow-purple-500/50 transition-all duration-500 transform hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <span className="relative flex items-center gap-3">
                <span className="text-xl group-hover:rotate-90 transition-transform duration-300">+</span>
                Add Persona
              </span>
            </button>
          </div>
        </div>

        {/* Personas Grid or Empty State */}
        {filteredPersonas.length === 0 ? (
          searchQuery ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="text-6xl mb-6 opacity-50">🔍</div>
              <h3 className="text-2xl font-semibold text-white mb-4">No personas found</h3>
              <p className="text-gray-400 text-center">Try adjusting your search query</p>
            </div>
          ) : (
            <EmptyState />
          )
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-16">
              {filteredPersonas.map((persona, index) => (
                <div
                  key={persona._id}
                  onClick={() => router.push(`/personas/${persona._id}`)}
                  className="group relative cursor-pointer transform hover:scale-105 transition-all duration-500"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: "slideInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                    opacity: 0,
                  }}
                >
                  {/* Glow effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur opacity-0 group-hover:opacity-30 transition-all duration-500"></div>
                  
                  <div className="relative bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 overflow-hidden">
                    {/* Animated background gradient */}
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/10 group-hover:to-blue-500/10 transition-all duration-500"></div>
                    
                    {/* Floating particles effect */}
                    <div className="absolute top-4 right-4 w-2 h-2 bg-purple-400/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-ping"></div>
                    <div className="absolute bottom-6 left-6 w-1 h-1 bg-blue-400/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse"></div>

                    <div className="flex flex-col items-center text-center relative z-10">
                      {/* Avatar with enhanced styling */}
                      <div className="relative mb-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center text-4xl shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-2">
                          {persona.avatarEmoji?.startsWith("http") ? (
                            <img
                              src={persona.avatarEmoji}
                              alt="Avatar"
                              className="w-16 h-16 object-cover rounded-full"
                            />
                          ) : (
                            <span className="drop-shadow-lg filter">
                              {persona.avatarEmoji || "👤"}
                            </span>
                          )}
                        </div>
                        {/* Ring animation */}
                        <div className="absolute inset-0 rounded-full border-2 border-purple-400/0 group-hover:border-purple-400/50 group-hover:scale-125 transition-all duration-500"></div>
                      </div>

                      {/* Name */}
                      <h2 className="text-xl font-bold text-white mb-2 group-hover:text-purple-200 transition-colors duration-300">
                        {persona.name}
                      </h2>
                      
                      {/* Description placeholder */}
                      <p className="text-gray-400 text-sm leading-relaxed mb-4 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-100">
                        Ready to assist with specialized knowledge and insights
                      </p>

                      {/* Action indicator */}
                      <div className="flex items-center gap-2 text-purple-400 opacity-0 group-hover:opacity-100 transition-all duration-300 delay-200">
                        <span className="text-sm font-medium">Chat now</span>
                        <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform duration-300">→</span>
                      </div>
                    </div>

                    {/* Corner decoration */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-tr-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced Stats */}
            <div className="text-center">
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl rounded-full px-6 py-3 border border-white/20">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-gray-300 font-medium">
                  {filteredPersonas.length} persona{filteredPersonas.length !== 1 ? "s" : ""} ready to chat
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Enhanced CSS animations */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}