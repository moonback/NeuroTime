import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Sparkles, Minimize2, Maximize2 } from 'lucide-react';
import { useMissions } from '../context/MissionContext';
import { askAssistant } from '../services/geminiService';
import { toast } from 'sonner';

export const AiAssistant: React.FC = () => {
  const { missions } = useMissions();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Bonjour ! Je suis NeuroBot. Je peux analyser vos missions, calculer vos revenus ou répondre à vos questions sur votre activité. Que voulez-vous savoir ?' }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await askAssistant(userMessage, { missions });
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      toast.error("Erreur lors de la communication avec l'IA");
      setMessages(prev => [...prev, { role: 'assistant', content: "Désolé, j'ai rencontré une erreur." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 md:bottom-8 right-4 z-50 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 md:p-4 rounded-full shadow-lg hover:scale-110 transition-transform group"
        title="Ouvrir l'assistant IA"
      >
        <Sparkles size={24} className="group-hover:animate-spin-slow" />
        <span className="absolute -top-2 -right-2 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-purple-500"></span>
        </span>
      </button>
    );
  }

  return (
    <div className={`fixed z-50 transition-all duration-300 ease-in-out ${
      isMinimized 
        ? 'bottom-20 md:bottom-8 right-4 w-72 h-14' 
        : 'bottom-0 md:bottom-8 right-0 md:right-4 w-full md:w-96 h-[80vh] md:h-[600px] max-h-screen'
    }`}>
      <div className="bg-dark-200/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-t-2xl md:rounded-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-b border-white/10 flex items-center justify-between cursor-pointer" onClick={() => !isMinimized && setIsMinimized(!isMinimized)}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500 rounded-lg">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Assistant NeuroTime</h3>
              {!isMinimized && <p className="text-[10px] text-indigo-200 flex items-center gap-1"><Sparkles size={8} /> Propulsé par Gemini</p>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
              className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              className="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Chat Area */}
        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' ? 'bg-primary-500' : 'bg-indigo-600'
                  }`}>
                    {msg.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
                  </div>
                  <div className={`rounded-2xl p-3 text-sm max-w-[80%] ${
                    msg.role === 'user' 
                      ? 'bg-primary-500/20 text-white border border-primary-500/30 rounded-tr-sm' 
                      : 'bg-indigo-600/20 text-gray-100 border border-indigo-500/30 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Bot size={14} className="text-white" />
                  </div>
                  <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-2xl rounded-tl-sm p-3 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-white/10 bg-dark-300/50">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Posez une question sur vos missions..."
                  disabled={isLoading}
                  className="w-full bg-dark-100 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

