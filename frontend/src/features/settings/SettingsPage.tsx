import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Settings as SettingsIcon, Bot, Key, Shield, CheckCircle2, Save } from 'lucide-react';
import { settingsApi } from '../../api';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export const SettingsPage: React.FC = () => {
  const { data: settingsData, isLoading, refetch } = useQuery({
    queryKey: ['systemSettings'],
    queryFn: settingsApi.get,
  });

  const [aiProvider, setAiProvider] = useState<string>('gemini');
  const [modelName, setModelName] = useState<string>('gemini-2.0-flash');
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [groqKey, setGroqKey] = useState<string>('');
  const [openRouterKey, setOpenRouterKey] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  React.useEffect(() => {
    if (settingsData) {
      setAiProvider(settingsData.ai_provider || 'gemini');
      setModelName(settingsData.ai_model_name || 'gemini-2.0-flash');
    }
  }, [settingsData]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) => settingsApi.updateAi(payload),
    onSuccess: () => {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      refetch();
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      ai_provider: aiProvider,
      ai_model_name: modelName,
      gemini_api_key: geminiKey || undefined,
      groq_api_key: groqKey || undefined,
      openrouter_api_key: openRouterKey || undefined,
    });
  };

  if (isLoading) {
    return <LoadingSkeleton rows={6} />;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">System Settings & AI Orchestration</h2>
        <p className="text-xs text-slate-500 mt-1">
          Configure provider-agnostic LLM engines, API secrets, and statutory financial tolerances.
        </p>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 rounded bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Settings saved and updated successfully.</span>
        </div>
      )}

      {/* AI Provider Card */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-5">
        <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
          <Bot className="h-5 w-5 text-[#0066ff]" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">AI Provider Configuration</h3>
            <p className="text-[11px] text-slate-500">Select active intelligence engine for Copilot and Exception Reasoning</p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">AI Engine Provider</label>
            <select
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value)}
              className="w-full rounded border border-slate-300 bg-white px-3.5 py-2 text-slate-900 focus:border-[#0066ff] focus:outline-none"
            >
              <option value="gemini">Google Gemini (Recommended — gemini-2.0-flash)</option>
              <option value="groq">Groq (Ultra-Fast Llama 3.3 70B)</option>
              <option value="openrouter">OpenRouter (Claude 3.5 Sonnet / Multi-Model)</option>
              <option value="ollama">Ollama (Local Offline Model)</option>
              <option value="fallback">Built-in Deterministic AI Reasoning (Zero API Key)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Model Name</label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="e.g. gemini-2.0-flash, llama-3.3-70b-versatile, llama3:latest"
              className="w-full rounded border border-slate-300 bg-white px-3.5 py-2 text-slate-900 font-mono focus:border-[#0066ff] focus:outline-none"
            />
          </div>

          {/* API Keys */}
          {aiProvider === 'gemini' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Google Gemini API Key</label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder={settingsData?.has_gemini_key ? '•••••••••••••••• (Configured)' : 'AIzaSy...'}
                className="w-full rounded border border-slate-300 bg-white px-3.5 py-2 text-slate-900 font-mono focus:border-[#0066ff] focus:outline-none"
              />
            </div>
          )}

          {aiProvider === 'groq' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Groq API Key</label>
              <input
                type="password"
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                placeholder={settingsData?.has_groq_key ? '•••••••••••••••• (Configured)' : 'gsk_...'}
                className="w-full rounded border border-slate-300 bg-white px-3.5 py-2 text-slate-900 font-mono focus:border-[#0066ff] focus:outline-none"
              />
            </div>
          )}

          {aiProvider === 'openrouter' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">OpenRouter API Key</label>
              <input
                type="password"
                value={openRouterKey}
                onChange={(e) => setOpenRouterKey(e.target.value)}
                placeholder={settingsData?.has_openrouter_key ? '•••••••••••••••• (Configured)' : 'sk-or-...'}
                className="w-full rounded border border-slate-300 bg-white px-3.5 py-2 text-slate-900 font-mono focus:border-[#0066ff] focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end pt-3">
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-2 rounded bg-[#0066ff] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0050cc] transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{updateMutation.isPending ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      {/* Financial Tolerances Card */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
          <Shield className="h-5 w-5 text-emerald-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Statutory Financial Defaults</h3>
            <p className="text-[11px] text-slate-500">Indian payment gateway schedules & reconciliation tolerances</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs font-mono text-slate-700 tnum">
          <div className="rounded bg-slate-50 p-3.5 border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block">Default Gateway MDR Fee</span>
            <span className="text-sm font-bold text-slate-900">2.0% (₹20 per ₹1,000)</span>
          </div>
          <div className="rounded bg-slate-50 p-3.5 border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block">GST Rate on Gateway MDR</span>
            <span className="text-sm font-bold text-slate-900">18.0% (Effective 2.36% Total)</span>
          </div>
          <div className="rounded bg-slate-50 p-3.5 border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block">Default Date Window</span>
            <span className="text-sm font-bold text-slate-900">± 3 Business Days</span>
          </div>
          <div className="rounded bg-slate-50 p-3.5 border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-sans font-bold block">Rounding Tolerance</span>
            <span className="text-sm font-bold text-slate-900">₹0.05</span>
          </div>
        </div>
      </div>
    </div>
  );
};
