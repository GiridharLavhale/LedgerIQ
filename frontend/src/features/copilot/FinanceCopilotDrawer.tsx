import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Terminal, Link as LinkIcon, Sparkles } from 'lucide-react';
import { copilotApi } from '../../api';
import { CopilotResponse } from '../../types';

interface FinanceCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  responseObj?: CopilotResponse;
}

export const FinanceCopilotDrawer: React.FC<FinanceCopilotDrawerProps> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: '👋 Hello! I am the **LedgerIQ Finance Copilot**.\n\nI query verified backend financial records, calculate exact variances, and explain reconciliation discrepancies with **zero hallucinations**.\n\nHow can I assist your operations today?',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const newMsgs: Message[] = [...messages, { sender: 'user', text: query }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);

    try {
      const res = await copilotApi.chat(query);
      setMessages([...newMsgs, { sender: 'assistant', text: res.reply, responseObj: res }]);
    } catch (err: any) {
      setMessages([
        ...newMsgs,
        {
          sender: 'assistant',
          text: '⚠️ An error occurred while retrieving database records. Please verify the backend connection.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSend(prompt);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-drawer">
      {/* Drawer Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-50 text-[#0066ff] border border-blue-200 shadow-sm">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Finance Copilot</h3>
              <span className="rounded-full bg-emerald-50 px-2 py-0.2 text-[10px] font-bold text-emerald-800 border border-emerald-200 font-mono">
                GROUNDED
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Zero Hallucination Financial Controller</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-sans">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[90%] rounded-lg p-3.5 shadow-sm leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-[#0066ff] text-white rounded-br-none'
                  : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.text}</p>

              {/* Tool Execution Logs Pill */}
              {m.responseObj && m.responseObj.tool_calls && m.responseObj.tool_calls.length > 0 && (
                <div className="mt-3 rounded border border-slate-200 bg-white p-2.5 font-mono text-[11px] text-slate-600 space-y-1.5 shadow-sm">
                  <div className="flex items-center gap-1.5 text-[#0066ff] font-bold text-[10px] uppercase">
                    <Terminal className="h-3 w-3" />
                    <span>Verified Backend Tool Invocations:</span>
                  </div>
                  {m.responseObj.tool_calls.map((tc, tIdx) => (
                    <div key={tIdx} className="text-slate-700">
                      <span className="font-semibold text-amber-700">⚡ {tc.tool_name}</span>: {tc.result_summary}
                    </div>
                  ))}
                </div>
              )}

              {/* Citation Chips */}
              {m.responseObj && m.responseObj.citations && m.responseObj.citations.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 font-mono">
                  {m.responseObj.citations.map((c, cIdx) => (
                    <span
                      key={cIdx}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-800"
                    >
                      <LinkIcon className="h-2.5 w-2.5" />
                      <span>{c.reference_code || c.entity_id.slice(0, 8)}</span>
                      {c.amount && <span>(₹{c.amount.toLocaleString()})</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 p-3 text-xs text-[#0066ff] font-mono animate-pulse">
            <Bot className="h-4 w-4 animate-spin" />
            <span>Querying verified database records & financial tools...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="border-t border-slate-200 bg-slate-50/70 px-6 py-2.5">
        <div className="flex gap-2 overflow-x-auto text-[11px]">
          <button
            onClick={() => handleQuickPrompt('How much money is currently unreconciled?')}
            className="whitespace-nowrap rounded border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700 hover:border-[#0066ff] hover:text-[#0066ff]"
          >
            💰 Unreconciled amount
          </button>
          <button
            onClick={() => handleQuickPrompt('Show me the largest discrepancies.')}
            className="whitespace-nowrap rounded border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700 hover:border-[#0066ff] hover:text-[#0066ff]"
          >
            ⚠️ Largest discrepancies
          </button>
          <button
            onClick={() => handleQuickPrompt('What are the top reasons for failed reconciliation?')}
            className="whitespace-nowrap rounded border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700 hover:border-[#0066ff] hover:text-[#0066ff]"
          >
            🔍 Root-cause breakdown
          </button>
        </div>
      </div>

      {/* Chat Input */}
      <div className="border-t border-slate-200 p-4 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a grounded FinOps question..."
            className="flex-1 rounded border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-[#0066ff] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-8 w-8 items-center justify-center rounded bg-[#0066ff] text-white hover:bg-[#0050cc] transition-colors disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
