"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Bot, Send, Loader2, User, FileText } from "lucide-react";
import { useRagChat } from "@/hooks/use-rag-chat";

export function RagChatModule({ onExit }: { onExit: () => void }) {
  const { messages, loading, error, sendMessage } = useRagChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: "linear-gradient(180deg, #ECFEFF 0%, #F0FDFA 100%)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3.5 shrink-0" style={{ background: "linear-gradient(135deg, #0E7490, #0EA5A4)" }}>
        <button onClick={onExit} className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center cursor-pointer active:scale-95 transition-transform" style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.28)" }}>
          <ArrowLeft size={18} color="#fff" />
        </button>
        <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F7D26B, #F0A500)" }}>
          <Bot size={18} color="#3a2a00" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[15px] text-white tracking-tight">CML Document Assistant</div>
          <div className="text-[11px] text-white/70">Circulars &middot; Rules &middot; Guidelines</div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-hide">
        {messages.length === 0 && (
          <div className="flex flex-col items-center text-center gap-2 mt-10 px-6">
            <Bot size={32} color="#0E7490" />
            <p className="text-sm font-semibold" style={{ color: "#0E7490" }}>Ask about activities, circulars, or competition rules</p>
            <p className="text-xs text-gray-500">e.g. &ldquo;What are July&apos;s activities?&rdquo; or &ldquo;Group Song participant limit?&rdquo;</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex items-start gap-2 max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div
                className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                style={{ background: m.role === "user" ? "#0E7490" : "#F0A500" }}
              >
                {m.role === "user" ? <User size={13} color="#fff" /> : <Bot size={13} color="#3a2a00" />}
              </div>
              <div>
                <div
                  className="px-3.5 py-2.5 rounded-2xl text-[13.5px] leading-relaxed whitespace-pre-wrap"
                  style={{
                    background: m.role === "user" ? "#0E7490" : "#fff",
                    color: m.role === "user" ? "#fff" : "#1e293b",
                    borderTopRightRadius: m.role === "user" ? 4 : undefined,
                    borderTopLeftRadius: m.role === "assistant" ? 4 : undefined,
                    boxShadow: m.role === "assistant" ? "0 2px 8px rgba(14,116,144,0.08)" : undefined,
                  }}
                >
                  {m.content}
                </div>
                {m.role === "assistant" && m.citations && m.citations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {m.citations.map((c, ci) => (
                      <span key={ci} className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-1 rounded-md" style={{ background: "#ecfeff", color: "#0e7490" }}>
                        <FileText size={10} />
                        {c.documentTitle}{c.pageNumber ? ` · p.${c.pageNumber}` : ""}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white" style={{ borderTopLeftRadius: 4, boxShadow: "0 2px 8px rgba(14,116,144,0.08)" }}>
              <Loader2 size={14} className="animate-spin" color="#0E7490" />
              <span className="text-[12.5px] font-medium text-gray-500">Thinking…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center text-xs font-medium text-red-500 px-4">{error}</div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 pb-4 pt-2 shrink-0" style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(10px)" }}>
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            placeholder="Ask a question…"
            className="flex-1 px-4 py-2.5 rounded-full text-sm font-medium outline-none bg-white border border-gray-200 focus:ring-2 focus:ring-cyan-200"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center cursor-pointer disabled:opacity-40 active:scale-95 transition-transform border-none"
            style={{ background: "linear-gradient(135deg,#0E7490,#0EA5A4)" }}
          >
            <Send size={16} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}
