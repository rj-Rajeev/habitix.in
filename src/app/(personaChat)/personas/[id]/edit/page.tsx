"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface IPersona {
  _id: string;
  name: string;
  avatarEmoji?: string;
  description?: string;
  systemPrompt?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}


export default function PersonaDetailPage() {
  const [persona, setPersona] = useState<IPersona | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const router = useRouter();
    const params = useParams();
  
  const personaId = params.id; 

  useEffect(() => {
    // Your API call
    fetch(`/api-v2/personas/${personaId}`)
      .then((res) => res.json())
      .then((data) => {
        setPersona(data.persona || data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch persona:', error);
        setLoading(false);
      });
  }, [personaId]);

  const handleStartConversation = () => {
    router.push(`/personas/${personaId}`);
  };

  const handleEdit = () => {
    router.push(`/personas/${personaId}/edit`);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this persona?")) {
      try {
        await fetch(`/api-v2/personas/${personaId}`, {
          method: 'DELETE',
        });
        router.push('/personas');
      } catch (error) {
        console.error('Failed to delete persona:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 container mx-auto px-6 py-12">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-white/10 rounded-2xl animate-pulse"></div>
            <div className="h-8 bg-white/10 rounded-lg w-48 animate-pulse"></div>
          </div>

          {/* Main Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 max-w-4xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 animate-pulse">
                <div className="h-6 bg-white/20 rounded-lg w-32 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-white/20 rounded w-full"></div>
                  <div className="h-4 bg-white/20 rounded w-3/4"></div>
                  <div className="h-4 bg-white/20 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">😔</div>
          <h2 className="text-2xl font-bold text-white mb-4">Persona Not Found</h2>
          <p className="text-slate-200 mb-8">The persona you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/personas')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-2xl font-semibold hover:scale-105 transition-transform duration-300 shadow-lg"
          >
            Back to Personas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.08),transparent_50%)]"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/8 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="group bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-3 hover:bg-white/30 transition-all duration-300 shadow-lg"
            >
              <span className="text-white text-xl group-hover:-translate-x-1 transition-transform duration-300">←</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Persona Details</h1>
              <p className="text-slate-200">Complete information about your AI personality</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleStartConversation}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-2xl font-semibold hover:scale-105 transition-all duration-300 shadow-lg flex items-center gap-2"
            >
              <span className="text-lg">💬</span>
              Start Chat
            </button>
            {/* <button
              onClick={handleEdit}
              className="group bg-white/20 backdrop-blur-xl border border-white/30 text-white px-4 py-3 rounded-2xl hover:bg-white/30 transition-all duration-300 flex items-center gap-2 shadow-lg"
            >
              <span className="text-lg">✏️</span>
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="group bg-red-500/30 backdrop-blur-xl border border-red-400/40 text-red-200 px-4 py-3 rounded-2xl hover:bg-red-500/40 transition-all duration-300 flex items-center gap-2 shadow-lg"
            >
              <span className="text-lg">🗑️</span>
              Delete
            </button> */}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* Persona Overview */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/30 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-white/25 to-white/15 rounded-full flex items-center justify-center text-6xl shadow-2xl mx-auto mb-6 border border-white/20">
                {persona.avatarEmoji?.startsWith("http") ? (
                  <img
                    src={persona.avatarEmoji}
                    alt="Avatar"
                    className="w-24 h-24 object-cover rounded-full"
                  />
                ) : (
                  <span className="drop-shadow-lg filter">
                    {persona.avatarEmoji || "👤"}
                  </span>
                )}
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{persona.name}</h2>
              {persona.createdAt && (
                <p className="text-slate-300 text-sm">
                  Created {new Date(persona.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/30 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">📋</span>
              <h3 className="text-2xl font-bold text-white">About This Persona</h3>
            </div>
            <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-600/50">
              <div className="text-slate-100 leading-relaxed text-lg whitespace-pre-line">
                {persona.description || (
                  <span className="text-slate-400 italic">No description available.</span>
                )}
              </div>
            </div>
          </div>

          {/* System Prompt */}
          {persona.systemPrompt && (
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/30 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">⚙️</span>
                <h3 className="text-2xl font-bold text-white">System Configuration</h3>
                <span className="bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full text-sm font-medium border border-blue-400/30">
                  Technical Details
                </span>
              </div>
              
              <div className="bg-slate-900/60 rounded-2xl border border-slate-700/60 overflow-hidden">
                <div className="bg-slate-800/80 px-6 py-3 border-b border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-slate-300 text-sm ml-3 font-mono">system_prompt.txt</span>
                  </div>
                  <button 
                    onClick={() => navigator.clipboard.writeText(persona.systemPrompt || '')}
                    className="text-slate-400 hover:text-slate-200 text-sm px-2 py-1 rounded hover:bg-slate-700/50 transition-colors"
                  >
                    Copy
                  </button>
                </div>
                
                <div className="p-6 max-h-96 overflow-y-auto custom-scrollbar">
                  <pre className="text-slate-200 leading-relaxed text-sm whitespace-pre-wrap font-mono">
                    {persona.systemPrompt}
                  </pre>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-blue-500/10 rounded-xl border border-blue-400/20">
                <div className="flex items-start gap-3">
                  <span className="text-blue-400 text-lg">ℹ️</span>
                  <div>
                    <p className="text-blue-200 text-sm font-medium mb-1">System Prompt Info</p>
                    <p className="text-blue-300 text-sm leading-relaxed">
                      This configuration defines how the AI persona behaves, responds, and interacts. 
                      It includes personality traits, communication style, and specific instructions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          {(persona.createdAt || persona.updatedAt) && (
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📊</span>
                <h3 className="text-xl font-bold text-white">Metadata</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {persona.createdAt && (
                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-600/30">
                    <p className="text-slate-400 text-sm mb-1">Created</p>
                    <p className="text-slate-200 font-mono text-sm">
                      {new Date(persona.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {persona.updatedAt && (
                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-600/30">
                    <p className="text-slate-400 text-sm mb-1">Last Updated</p>
                    <p className="text-slate-200 font-mono text-sm">
                      {new Date(persona.updatedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced CSS */}
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

        .animate-slideInUp {
          animation: slideInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgb(100 116 139) rgb(30 41 59);
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgb(30 41 59);
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(100 116 139);
          border-radius: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(148 163 184);
        }
      `}</style>
    </div>
  );
}