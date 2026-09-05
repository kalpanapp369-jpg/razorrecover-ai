import React, { useState, useRef, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { api } from '../../lib/api';
import {
  Send,
  Bot,
  User,
  Loader2,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const Copilot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am RazorRecover AI Copilot. I analyze gateway decline codes, simulate recovery yields, and ensure strict compliance with human-in-the-loop guardrails. How can I assist you today?',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const userText = input.trim();
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const res = await api.askCopilot(userText);
      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: res.data?.answer || res.data?.reply || 'I analyzed the telemetry but could not generate a response.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Error connecting to AI Copilot: ${err.message || 'Please check Gemini API key configuration.'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col space-y-4">
      <PageHeader
        title="AI Recovery Copilot"
        subtitle="Autonomous intelligence assistant for incident diagnosis, recovery simulations & approval policies"
        badge="Copilot Agent"
      />

      {/* Chat Container with Blade styling */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-[4px] border border-slate-200 bg-white shadow-blade-sm">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] bg-[#0D94FB] text-white shadow-2xs">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-xl rounded-[4px] p-3.5 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-50 text-[#0C2651] border border-blue-200 font-medium'
                    : 'bg-slate-50 text-slate-800 border border-slate-200'
                }`}
              >
                {msg.content}
              </div>

              {msg.role === 'user' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] bg-[#0C2651] text-white shadow-2xs">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {isSending && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] bg-[#0D94FB] text-white shadow-2xs">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-[4px] bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200 flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0D94FB]" />
                <span>Copilot is querying recovery logs and telemetry...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="border-t border-slate-200 bg-slate-50/80 px-4 py-2 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
            Suggested:
          </span>
          <button
            onClick={() => handleQuickPrompt('Which cases require urgent human approval right now?')}
            className="rounded-[4px] border border-blue-200 bg-white hover:bg-blue-50 px-2.5 py-1 text-xs font-medium text-[#0D94FB] shrink-0 transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]"
          >
            Pending approvals?
          </button>
          <button
            onClick={() => handleQuickPrompt('What is our active recovery policy for failed card payments?')}
            className="rounded-[4px] border border-slate-200 bg-white hover:bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 shrink-0 transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]"
          >
            Card retry policies?
          </button>
          <button
            onClick={() => handleQuickPrompt('What is our current revenue at risk this week?')}
            className="rounded-[4px] border border-slate-200 bg-white hover:bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 shrink-0 transition-all duration-150 ease-out hover:scale-[1.02] active:scale-[0.98]"
          >
            Current revenue at risk?
          </button>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="border-t border-slate-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Copilot about recovery incidents, telemetry, policy rules..."
              className="flex-1 rounded-[4px] border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all duration-120 focus:border-[#0D94FB] focus:bg-white focus:ring-2 focus:ring-[#0D94FB]/20"
            />
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-[#0D94FB] hover:bg-[#0B82DE] text-white disabled:opacity-40 transition-all duration-150 ease-out hover:scale-[1.05] active:scale-[0.95]"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
