import React, { useState, useEffect, useRef } from "react";
import { Search, X, Compass, CloudSun, Calendar, Coins, Settings, ArrowRight, User } from "lucide-react";
import { api } from "@/lib/api-client";
import { ConfirmationCard } from "./ConfirmationCard";
import { useRouter } from "next/navigation";

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  pageContext?: string;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  isOpen,
  onClose,
  pageContext = "",
}) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Generate dynamic contextual suggestions based on current page path
  useEffect(() => {
    if (pageContext.includes("weather")) {
      setSuggestions(["Kal baarish hogi kya?", "Spray karna safe hai aaj?", "Is hafte ka forecast"]);
    } else if (pageContext.includes("expenses")) {
      setSuggestions(["Is season mein kitna kharcha hua?", "500 rupaye mazdoori add karo", "Total seed expense details"]);
    } else if (pageContext.includes("plots")) {
      setSuggestions(["Mere kapas ke khet dikhao", "Plot 4 kholo", "Kitne plots verified hain?"]);
    } else if (pageContext.includes("crops")) {
      setSuggestions(["Mere tamatar ki fasal kaisi hai?", "Harvest कब करें?", "Gehun list karo"]);
    } else {
      setSuggestions(["Mera farming summary batao", "Kal baarish hogi?", "500 rupaye mazdoori add करो"]);
    }
  }, [pageContext, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResult(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle hotkeys (Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearch = async (textOverride?: string) => {
    const searchQuery = textOverride !== undefined ? textOverride : query;
    if (!searchQuery.trim()) return;

    if (textOverride !== undefined) {
      setQuery(searchQuery);
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await api.sendChat({
        message: searchQuery,
        page_context: pageContext,
      });
      setResult(res.data);

      // Handle navigation tool instantly if it doesn't need confirmation
      if (res.data.tool_used === "navigation_tool" && res.data.action_result?.navigate && !res.data.needs_confirmation) {
        const target = res.data.action_result.target_page;
        const qps = res.data.action_result.query_params || {};
        let routePath = `/dashboard/${target}`;
        if (target === "dashboard") routePath = "/dashboard";
        if (qps.plot_id) routePath += `?plot_id=${qps.plot_id}`;
        router.push(routePath);
        setTimeout(() => onClose(), 800); // Close command bar after routing starts
      }
    } catch (err) {
      console.error("Command bar query failed:", err);
      setResult({
        response_text: "Failed to process command. Please check server connection.",
        suggestions: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmationConfirm = async (finalParams: Record<string, any>) => {
    if (!result) return;
    setLoading(true);
    try {
      // Simulate confirmation message: sending "Haan" to the session
      const res = await api.sendChat({
        message: "Haan",
        session_id: result.session_id,
        page_context: pageContext,
      });
      setResult(res.data);
    } catch (err) {
      console.error("Action confirmation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmationCancel = async () => {
    if (!result) return;
    setLoading(true);
    try {
      const res = await api.sendChat({
        message: "Cancel",
        session_id: result.session_id,
        page_context: pageContext,
      });
      setResult(res.data);
    } catch (err) {
      console.error("Action cancel failed:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-24 px-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Spotlight Window */}
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md flex flex-col max-h-[600px] transition-all transform scale-100">
        
        {/* Search Input Area */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-900 bg-zinc-950/60">
          <Search className="w-5 h-5 text-zinc-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            placeholder="Type a command or ask a question (e.g. Kal baarish hogi?)..."
            className="flex-1 bg-transparent border-none text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-0"
            disabled={loading}
          />
          {query && (
            <button 
              onClick={() => setQuery("")} 
              className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded hover:bg-zinc-900 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Content Panel */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-center justify-center py-8 gap-3 text-zinc-500 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Searching database and evaluating tools...
            </div>
          )}

          {/* Results Render */}
          {!loading && result && (
            <div className="space-y-3.5">
              {/* Natural Language Response */}
              <div className="bg-zinc-900/40 border border-zinc-900 p-3.5 rounded-xl text-zinc-200 text-xs leading-relaxed">
                {result.response_text}
              </div>

              {/* Action Confirmation Inline Card */}
              {result.needs_confirmation && result.confirmation_data && (
                <div className="max-w-md mx-auto">
                  <ConfirmationCard
                    tool={result.confirmation_data.tool}
                    params={result.confirmation_data.params}
                    onConfirm={handleConfirmationConfirm}
                    onCancel={handleConfirmationCancel}
                  />
                </div>
              )}

              {/* Tool Execution Details */}
              {result.tool_used && !result.needs_confirmation && (
                <div className="border border-zinc-900/80 bg-zinc-950/40 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 font-mono">Tool Executed</span>
                    <span className="text-[10px] font-semibold text-emerald-400 font-mono">{result.tool_used}</span>
                  </div>
                  {result.action_result && (
                    <pre className="text-[10px] text-zinc-400 font-mono bg-zinc-950 p-2.5 rounded overflow-x-auto border border-zinc-900/60 max-h-32">
                      {JSON.stringify(result.action_result, null, 2)}
                    </pre>
                  )}
                </div>
              )}

              {/* Follow-up suggestions */}
              {result.suggestions && result.suggestions.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-mono">Suggestions</div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.suggestions.map((sug: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => handleSearch(sug)}
                        className="text-[10px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-2.5 py-1 rounded-full transition-all cursor-pointer"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contextual Suggestions List */}
          {!loading && !result && (
            <div className="space-y-3">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" /> Suggested Queries for this page
              </div>
              <div className="flex flex-col gap-1">
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearch(sug)}
                    className="w-full flex items-center justify-between text-left px-3 py-2.5 rounded-lg bg-zinc-900/30 hover:bg-zinc-900 border border-transparent hover:border-zinc-800/60 transition-all text-xs text-zinc-300 hover:text-zinc-100 group cursor-pointer"
                  >
                    <span>{sug}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 bg-zinc-950 border-t border-zinc-900 flex justify-between items-center text-[10px] text-zinc-600 font-mono">
          <div className="flex items-center gap-3">
            <span><kbd className="bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800">Enter</kbd> to search</span>
            <span><kbd className="bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800">Esc</kbd> to close</span>
          </div>
          <span className="flex items-center gap-1"><User className="w-3 h-3 text-zinc-500" /> Krishi Mitra CIE v1.0</span>
        </div>
      </div>
    </div>
  );
};
