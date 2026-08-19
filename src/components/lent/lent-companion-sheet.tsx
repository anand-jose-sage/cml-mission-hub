"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { askAI, STARTERS, type AskAIContext } from "./lent-ai";
import { LentChip, LentIcon, type LentTheme } from "./lent-shared";

interface Msg { who: "u" | "a"; text: string; }

export function LentCompanionSheet({
  theme, seedQuestion, defaultMessage, aiContext, onRestartDay, onShowMichaelPrayer, onClose,
}: {
  theme: LentTheme;
  seedQuestion: string | null;
  defaultMessage: string;
  aiContext: AskAIContext;
  onRestartDay: () => void;
  onShowMichaelPrayer: () => void;
  onClose: () => void;
}) {
  const [msgs, setMsgs] = useState<Msg[]>(() =>
    seedQuestion ? [{ who: "u", text: seedQuestion }] : [{ who: "a", text: defaultMessage }]
  );
  const [chatDraft, setChatDraft] = useState("");
  const [sending, setSending] = useState(false);
  const seededRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!seedQuestion || seededRef.current) return;
    seededRef.current = true;
    setSending(true);
    askAI(seedQuestion, aiContext).then((answer) => {
      setMsgs((m) => [...m, { who: "a", text: answer }]);
      setSending(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs]);

  const send = async () => {
    const t = chatDraft.trim();
    if (!t || sending) return;
    setChatDraft("");
    setMsgs((m) => [...m, { who: "u", text: t }]);
    setSending(true);
    const answer = await askAI(t, aiContext);
    setMsgs((m) => [...m, { who: "a", text: answer }]);
    setSending(false);
  };

  const sendStarter = async (label: string) => {
    if (sending) return;
    // These two perform a real action instead of a chat reply — restarting
    // today's progress or opening the prayer popup wouldn't make sense as
    // text in a chat bubble, so close the sheet and do the thing directly.
    if (label.includes("മിഖായേ")) { onClose(); return onShowMichaelPrayer(); }
    if (label.includes("വീണ്ടും ആരംഭ")) { onClose(); return onRestartDay(); }
    setMsgs((m) => [...m, { who: "u", text: label }]);
    setSending(true);
    const answer = await askAI(label, aiContext);
    setMsgs((m) => [...m, { who: "a", text: answer }]);
    setSending(false);
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[10]" style={{ background: "rgba(0,0,0,.55)", backdropFilter: "blur(3px)" }} />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.34, ease: [0.22, 0.9, 0.24, 1] }}
        className="fixed left-0 right-0 bottom-0 z-[11] flex flex-col max-w-md mx-auto"
        style={{
          maxHeight: "74%", borderRadius: "28px 28px 0 0", background: theme.bg2,
          border: `1px solid ${theme.line}`, boxShadow: "0 -30px 60px -20px rgba(0,0,0,.7)",
        }}
      >
        <div className="flex items-center gap-2.5 px-5 pt-4 pb-3">
          <span className="text-[12px]">✨</span>
          <span className="flex-1 text-[12.5px] font-semibold" style={{ fontFamily: "var(--font-lent-malayalam), sans-serif", color: theme.accent2 }}>ഇന്നത്തെ വഴികാട്ടി</span>
          <button
            onClick={onClose}
            className="w-[26px] h-[26px] rounded-full cursor-pointer flex items-center justify-center"
            style={{ color: theme.muted, background: theme.surf, border: `1px solid ${theme.line}` }}
            aria-label="Close"
          >
            <LentIcon name="X" size={13} color={theme.muted} />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pt-1 pb-2 flex flex-col gap-3.5">
          {msgs.map((m, i) => (
            <div
              key={i}
              className={m.who === "u" ? "self-end max-w-[78%]" : "self-start max-w-[92%]"}
              style={{
                padding: m.who === "u" ? "11px 15px" : "2px 0",
                borderRadius: m.who === "u" ? "18px 18px 6px 18px" : 0,
                background: m.who === "u" ? theme.surf2 : "transparent",
                border: m.who === "u" ? `1px solid ${theme.line}` : "1px solid transparent",
              }}
            >
              <div className="whitespace-pre-line" style={{ fontFamily: "var(--font-lent-malayalam), sans-serif", fontSize: 14.5, lineHeight: 1.8, color: theme.text }}>{m.text}</div>
            </div>
          ))}
          {sending && (
            <div className="self-start"><LentIcon name="Loader2" size={16} color={theme.muted} className="animate-spin" /></div>
          )}
          <div className="flex flex-wrap gap-[7px] py-1">
            {STARTERS.map((label) => (
              <LentChip key={label} label={label} muted onClick={() => sendStarter(label)} />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-[18px] pt-3 pb-[26px]">
          <input
            value={chatDraft}
            onChange={(e) => setChatDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder="Ask anything…"
            className="flex-1"
            style={{ padding: "13px 15px", borderRadius: 999, fontFamily: "var(--font-lent-malayalam), sans-serif", fontSize: 13.5, color: theme.text, background: theme.surf, border: `1px solid ${theme.line}`, outline: "none" }}
          />
          <button
            onClick={send}
            disabled={sending}
            className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer border-none disabled:opacity-50"
            style={{ color: "#fff", background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})` }}
            aria-label="Send"
          >
            <LentIcon name="Send" size={17} color="#fff" />
          </button>
        </div>
      </motion.div>
    </>
  );
}
