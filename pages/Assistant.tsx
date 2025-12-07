
import React, { useState, useEffect, useRef } from 'react';
import { Send, MapPin, Sparkles, User as UserIcon, Loader2, Globe } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { dataService } from '../services/store';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  groundingChunks?: any[];
  timestamp: Date;
}

const Assistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your Field Assistant. I can help you find nearby suppliers, search the web for specifications, or look up details about your assigned projects. What do you need?',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateProjectContext = () => {
    const assignments = dataService.getAssignments();
    let projectDataContext = "Here is the current project database for context. Use this to answer questions about specific projects:\n";
    
    assignments.forEach(project => {
        const details = project.extendedDetails || {};
        // Safely access properties with fallbacks
        const ntp = project.title;
        const supervisor = project.supervisorId; // Ideally map to name, but ID works for context matching
        const status = details.constructionStatus || project.status;
        const area = details.area || "N/A";
        const footageRemaining = project.metrics.targetFootage - project.metrics.completedFootage;
        const percentComplete = details.percentageComplete ? `${Number(details.percentageComplete)*100}%` : "0%";
        const deadline = details.deadline || "N/A";
        const cost = details.estimatedCost || "N/A";
        const doorTag = details.doorTagDate || "N/A";
        const locates = details.locatesDate || "N/A";
        const vendor = project.crewId;
        const hhp = details.hhp || "N/A";
        const assigned = details.dateAssigned || "N/A";
        const completion = details.completionDate || "N/A";
        const tickets = details.locateTickets || "None";
        const address = project.address;

        projectDataContext += `\n- **${ntp}**\n  Address: ${address}\n  Supervisor: ${supervisor} | Status: ${status} | Area: ${area}\n  Footage Remaining: ${footageRemaining} | Complete: ${percentComplete} | Deadline: ${deadline}\n  Est Cost: ${cost} | Door Tag: ${doorTag} | Locates: ${locates}\n  Vendor: ${vendor} | HHP: ${hhp} | Assigned: ${assigned} | Completion: ${completion}\n  Locate Tickets: ${tickets}\n`;
    });
    return projectDataContext;
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Get location if possible
      let latLng = undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        latLng = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        };
      } catch (err) {
        console.warn('Location access denied or timed out');
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const config: any = {
        tools: [
          { googleMaps: {} }, 
          { googleSearch: {} }
        ],
      };

      if (latLng) {
        config.toolConfig = {
          retrievalConfig: { latLng }
        };
      }

      // Inject Project Data into Prompt
      const projectContext = generateProjectContext();
      const promptWithContext = `${projectContext}\n\nUser Question: ${userMsg.content}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: promptWithContext,
        config: config
      });

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const text = response.text;

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: text || "I found some information.",
        groundingChunks: groundingChunks,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I encountered an error accessing the assistant services. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "Status of 5th Ave project?",
    "Show me locate tickets for Oak Park",
    "Nearest hardware store",
    "Safety specs for fiber"
  ];

  return (
    <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center space-x-3">
        <div className="bg-purple-600 p-2 rounded-lg">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h2 className="font-bold text-slate-800">Field Assistant</h2>
          <p className="text-xs text-slate-500">Powered by Gemini + Google</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start max-w-[85%] md:max-w-[75%] space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                {msg.role === 'user' ? <UserIcon size={14} className="text-white" /> : <Sparkles size={14} className="text-white" />}
              </div>
              
              <div className="flex flex-col">
                <div className={`p-4 rounded-2xl shadow-sm text-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-slate-100 text-slate-800 rounded-tl-none'
                }`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>

                {/* Grounding Chunks (Maps & Web) */}
                {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Sources & Locations</p>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.groundingChunks.map((chunk, idx) => {
                        // Handle Maps Grounding
                        if (chunk.maps) {
                          return (
                            <a 
                              key={idx} 
                              href={chunk.maps.sourceUri?.uri || chunk.maps.uri}
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center p-3 bg-white border border-slate-200 rounded-lg hover:bg-purple-50 hover:border-purple-200 transition-colors group"
                            >
                              <div className="bg-red-100 p-2 rounded-full mr-3 group-hover:bg-red-200 transition-colors">
                                <MapPin size={16} className="text-red-600" />
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <p className="font-medium text-slate-800 truncate group-hover:text-purple-700">{chunk.maps.title}</p>
                                <p className="text-xs text-slate-500 truncate">View on Google Maps</p>
                              </div>
                            </a>
                          );
                        } 
                        // Handle Search/Web Grounding
                        else if (chunk.web) {
                           return (
                            <a 
                              key={idx} 
                              href={chunk.web.uri}
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center p-3 bg-white border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                            >
                              <div className="bg-blue-100 p-2 rounded-full mr-3 group-hover:bg-blue-200 transition-colors">
                                <Globe size={16} className="text-blue-600" />
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <p className="font-medium text-slate-800 truncate group-hover:text-blue-700">{chunk.web.title}</p>
                                <p className="text-xs text-slate-500 truncate">{chunk.web.uri}</p>
                              </div>
                            </a>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                )}
                
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="flex items-start space-x-3 max-w-[75%]">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center space-x-2 text-slate-500">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Finding answers...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestions.map((s) => (
              <button 
                key={s}
                onClick={() => {
                  setInputText(s);
                  // Optional: auto-send
                }}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full transition-colors border border-slate-200"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSend} className="flex space-x-2">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about nearby places or technical specs..." 
            className="flex-1 border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50"
          />
          <button 
            type="submit" 
            disabled={isLoading || !inputText.trim()}
            className={`bg-purple-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors shadow-sm flex items-center justify-center ${
              (isLoading || !inputText.trim()) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Assistant;
