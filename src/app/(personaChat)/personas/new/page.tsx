"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewPersonaPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    avatarEmoji: "",
    systemPrompt: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();

  const popularEmojis = [
    "👤", "🤖", "🧠", "💡", "✨", "🎯", "🚀", "💻",
    "📝", "🎨", "🔬", "👨‍🍳", "👩‍💻", "🌟", "💪", "🎭",
    "📚", "🎵", "🏆", "🔥", "⚡", "🌈", "🦄", "🎲"
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }
    
    if (!formData.systemPrompt.trim()) {
      newErrors.systemPrompt = "System prompt is required";
    } else if (formData.systemPrompt.length < 20) {
      newErrors.systemPrompt = "System prompt must be at least 20 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      
      const res = await fetch("/api-v2/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        router.push("/personas");
      }
      
      router.push("/personas");
    } catch (error) {
      console.error("Error creating persona:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCharacterCount = (text: string, max: number) => {
    const count = text.length;
    const isNearLimit = count > max * 0.8;
    return (
      <span className={`text-xs ${isNearLimit ? 'text-amber-500' : 'text-gray-400'}`}>
        {count}/{max}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <button
            onClick={() => router.push("/personas")}
            className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors duration-200"
          >
            <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
            Back to Personas
          </button>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-3">
            Create New Persona
          </h1>
          <p className="text-gray-600 text-sm sm:text-base max-w-2xl">
            Design an AI personality with unique traits, knowledge, and conversation style
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 mb-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  step <= currentStep 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-8 h-1 mx-2 rounded transition-colors duration-300 ${
                    step < currentStep ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center text-sm text-gray-500">
            Step {currentStep} of 3: {
              currentStep === 1 ? 'Basic Information' :
              currentStep === 2 ? 'Personality & Description' :
              'AI Instructions'
            }
          </div>
        </div>

        {/* Form */}
        <div className="max-w-2xl mx-auto">
          <div className="space-y-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-6 sm:p-8 space-y-6">
                
                {/* Step 1: Basic Information */}
                {currentStep >= 1 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                        1
                      </div>
                      <h2 className="text-xl font-semibold text-gray-800">Basic Information</h2>
                    </div>
                    
                    {/* Name Field */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Persona Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Creative Writer, Tech Expert, Life Coach"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className={`w-full px-4 py-3 rounded-2xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                          errors.name 
                            ? 'border-red-300 bg-red-50' 
                            : formData.name 
                              ? 'border-green-300 bg-green-50' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        maxLength={50}
                      />
                      <div className="flex justify-between">
                        {errors.name && <span className="text-red-500 text-xs">{errors.name}</span>}
                        {getCharacterCount(formData.name, 50)}
                      </div>
                    </div>

                    {/* Avatar Emoji Selector */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Avatar Emoji
                      </label>
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center text-2xl border-2 border-gray-200">
                        {formData?.avatarEmoji?.startsWith("http") ? (
                        <img
                        src={formData?.avatarEmoji}
                        alt="Avatar"
                        className="w-16 h-16 object-cover rounded-full"
                        />
                        ) : (
                        formData?.avatarEmoji || "👤"
                        )
                        }
                        </div>
                        <input
                          type="text"
                          placeholder="Paste emoji or URL"
                          value={formData.avatarEmoji}
                          onChange={(e) => handleInputChange("avatarEmoji", e.target.value)}
                          className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-200 bg-white hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>
                      <div className="grid grid-cols-8 gap-2">
                        {popularEmojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleInputChange("avatarEmoji", emoji)}
                            className={`w-10 h-10 rounded-xl border-2 transition-all duration-200 hover:scale-110 ${
                              formData.avatarEmoji === emoji 
                                ? 'border-blue-500 bg-blue-50 shadow-lg' 
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Description */}
                {currentStep >= 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pt-6 pb-4 border-t border-gray-100">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold">
                        2
                      </div>
                      <h2 className="text-xl font-semibold text-gray-800">Personality & Description</h2>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Description *
                      </label>
                      <p className="text-xs text-gray-500">
                        Describe this persona's role, expertise, and personality traits
                      </p>
                      <textarea
                        placeholder="This persona is a creative writing expert who helps users craft compelling stories, develop characters, and improve their writing style. They are encouraging, imaginative, and provide detailed feedback..."
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        rows={4}
                        className={`w-full px-4 py-3 rounded-2xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-purple-500/20 resize-none ${
                          errors.description 
                            ? 'border-red-300 bg-red-50' 
                            : formData.description.length >= 10
                              ? 'border-green-300 bg-green-50' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        maxLength={500}
                      />
                      <div className="flex justify-between">
                        {errors.description && <span className="text-red-500 text-xs">{errors.description}</span>}
                        {getCharacterCount(formData.description, 500)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: System Prompt */}
                {currentStep >= 3 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 pt-6 pb-4 border-t border-gray-100">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold">
                        3
                      </div>
                      <h2 className="text-xl font-semibold text-gray-800">AI Instructions</h2>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        System Prompt *
                      </label>
                      <p className="text-xs text-gray-500">
                        Define how this AI persona should behave, respond, and interact with users
                      </p>
                      <textarea
                        placeholder="You are a creative writing expert with 15+ years of experience in fiction and non-fiction writing. Your role is to help users improve their writing through constructive feedback, creative exercises, and personalized guidance. Always be encouraging while providing specific, actionable advice..."
                        value={formData.systemPrompt}
                        onChange={(e) => handleInputChange("systemPrompt", e.target.value)}
                        rows={6}
                        className={`w-full px-4 py-3 rounded-2xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-500/20 resize-none font-mono text-sm ${
                          errors.systemPrompt 
                            ? 'border-red-300 bg-red-50' 
                            : formData.systemPrompt.length >= 20
                              ? 'border-green-300 bg-green-50' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        maxLength={2000}
                      />
                      <div className="flex justify-between">
                        {errors.systemPrompt && <span className="text-red-500 text-xs">{errors.systemPrompt}</span>}
                        {getCharacterCount(formData.systemPrompt, 2000)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="px-6 sm:px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row gap-3 sm:justify-between">
                <div className="flex gap-3">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(prev => prev - 1)}
                      className="px-6 py-3 rounded-2xl border-2 border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-all duration-200 font-medium"
                    >
                      Previous
                    </button>
                  )}
                </div>
                
                <div className="flex gap-3">
                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(prev => prev + 1)}
                      disabled={
                        (currentStep === 1 && !formData.name.trim()) ||
                        (currentStep === 2 && !formData.description.trim())
                      }
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 font-medium"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      type="submit"
                      onClick={handleSubmit}
                      disabled={isSubmitting || Object.keys(errors).length > 0}
                      className="group px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 font-medium flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <span>Create Persona</span>
                          <span className="group-hover:translate-x-1 transition-transform duration-200">✨</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              💡 Tips for creating great personas
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Be specific about the persona's expertise and personality traits</li>
              <li>• Include examples of how they should respond in the system prompt</li>
              <li>• Consider the tone and style you want them to use</li>
              <li>• Think about what makes this persona unique and valuable</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}