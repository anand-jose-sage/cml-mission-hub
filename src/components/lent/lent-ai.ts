import type { LentDay, LentMeta } from "@/types";
import type { LentStage } from "@/hooks/use-lent-progress";

// Context the companion needs to answer with real, DB-loaded per-day content
// instead of generic canned text — passed in by whatever screen opens the
// sheet (see LentModule), never hardcoded here.
export interface AskAIContext {
  entry?: LentDay;
  meta?: LentMeta | null;
  actDone?: boolean; // has today's activity already been marked done?
}

// Stub companion "AI" — local keyword-matched canned replies, same shape as
// the design reference's localReply(). No LLM provider is configured
// anywhere in this codebase; this keeps the companion working today with
// zero cost and no new API key. `askAI` is the one function a future real
// model call needs to replace — nothing else in the UI would need to change.
export async function askAI(question: string, ctx: AskAIContext = {}): Promise<string> {
  const q = question;

  // Checked ahead of the generic prayer/action branches below since both
  // chip labels ("...പ്രാർത്ഥന", "...പ്രവർത്തനം") would otherwise also match
  // those broader patterns first.
  // "മിഖായേ" (not the full "മിഖായേൽ") — Malayalam chillu letters like the
  // trailing ൽ in "മിഖായേൽ" don't survive suffixing (e.g. the genitive
  // "മിഖായേലിന്റെ" uses plain ല instead), so matching the bare word would
  // miss every inflected form actually used in chip labels/free text.
  // The prayer itself is long, so this points at the dedicated popup
  // (see AI_ACTIONS below and LentMichaelPrayerOverlay) instead of dumping
  // the full bilingual text into a chat bubble.
  if (/മിഖായേ|michael/i.test(q)) {
    return "വിശുദ്ധ മിഖായേലിനോടുള്ള പ്രാർത്ഥന നീണ്ടതാണ് — 🛡️ ബട്ടൺ ടാപ്പ് ചെയ്‌താൽ അത് ഒരു പ്രത്യേക ജാലകത്തിൽ (മലയാളം/English) കാണാം.";
  }
  if (/ഇന്നത്തെ.{0,4}പ്രവർത്തനം|പ്രവൃത്തി|പ്രവർത്തനം|today.?s?\s*action|start.*(action|activity)|do.*(activity|today)|activity/i.test(q)) {
    if (!ctx.entry) return "ഇന്നത്തെ പ്രവർത്തനം ഉടൻ ലഭ്യമാകും.";
    const { activity: activityMl } = ctx.entry.ml;
    const { activity: activityEn } = ctx.entry.en;
    if (ctx.actDone) {
      return `നീ ഇന്നത്തെ പ്രവർത്തനം ഇതിനകം ചെയ്തുകഴിഞ്ഞു ✓\n\n“${activityMl}”\n\nനാളെ ഒരു പുതിയ ദിനം കാത്തിരിക്കുന്നു.`;
    }
    return `ഇന്ന് ഒരു ചെറിയ പ്രവർത്തി മതി:\n\n“${activityMl}”\n\n“${activityEn}”\n\nചെയ്തുകഴിഞ്ഞാൽ ആ ചുവട് അടയാളപ്പെടുത്താം.`;
  }
  if (/പ്രാർത്ഥ|prayer/i.test(q)) {
    return "ഒരു ചെറിയ പ്രാർത്ഥന:\n\n“കർത്താവേ, ഉപേക്ഷിക്കാൻ തോന്നുമ്പോൾ എന്നെ ഉറപ്പിക്കണമേ. വിശുദ്ധ മിഖായേലിന്റെ കൂടെ ഞാൻ ഇന്ന് ഒരു ചുവട് കൂടി എടുക്കുന്നു.”\n\nഇത് പതുക്കെ രണ്ടു പ്രാവശ്യം ചൊല്ലാം.";
  }
  if (/ഭയ|fear|afraid/i.test(q)) {
    return "ഭയം ഉണ്ടാകുന്നത് കൊണ്ട് നീ ദൈവത്തിൽ നിന്ന് അകന്നുപോകുന്നില്ല.\nഇന്ന് നമുക്ക് ദൈവസന്നിധിയിൽ കുറച്ച് സമയം നിൽക്കാം.\n\n“ഭയപ്പെടേണ്ടാ; ഞാൻ നിന്നോടുകൂടെയുണ്ട്.”";
  }
  if (/വചനം|അർത്ഥം|വിശദീകരി|explain|meaning/i.test(q)) {
    return "പൗലോസ് പറയുന്ന “ദൈവത്തിന്റെ കവചം” ഒരു യുദ്ധവസ്ത്രമല്ല — അത് സത്യം, നീതി, വിശ്വാസം, പ്രാർത്ഥന.\nഇന്നത്തെ അർത്ഥം ലളിതമാണ്: നിൽക്കുക. ഓടിപ്പോകേണ്ടതില്ല.";
  }
  if (/പോരാട്ടം|എങ്ങനെ|ഉദാഹരണ|how|example/i.test(q)) {
    return "ഇന്നത്തെ പോരാട്ടം വലിയ ഒന്നല്ല.\nഒരു ഉദാഹരണം: നിന്നെ ഏറ്റവും വേഗം തളർത്തുന്ന ഒരു ശീലം ഇന്ന് ഒരു തവണ ഉപേക്ഷിക്കുക — അതിന്റെ സ്ഥാനത്ത് ഒരു നിമിഷം പ്രാർത്ഥന.";
  }
  return "ഞാൻ ഇന്നത്തെ ദിനത്തോട് ചേർന്ന് നിൽക്കാം.\nഇന്ന് നീ മുന്നോട്ട് പോകാൻ വിളിക്കപ്പെട്ടിരിക്കുന്നു.\n\nഎന്താണ് ഇന്ന് നിന്നെ ഏറ്റവും തളർത്തുന്നത്?";
}

// Fixed set of quick-action chips shown on the companion card — same list
// regardless of stage (kept intentionally small; the last two are
// intercepted before ever reaching askAI — see lent-today.tsx — since they
// trigger a real action (reset progress / open the prayer popup) rather
// than a chat reply).
export const AI_ACTIONS: string[] = [
  "ഇന്നത്തെ വചനം വിശദീകരിക്കൂ",
  "ഇന്ന് എനിക്ക് വളരെ ഭയമാണ്",
  "ഇന്നത്തെ പോരാട്ടം എങ്ങനെ നേരിടാം?",
  "ഒരു ചെറിയ പ്രാർത്ഥന തരൂ",
  "🔄 ഇന്ന് വീണ്ടും ആരംഭിക്കാം",
  "🛡️ മിഖായേലിന്റെ പ്രാർത്ഥന",
];

// Same list shown once the sheet is already open — kept as one shared array
// so the two surfaces (companion card + inside the sheet) can never drift.
export const STARTERS: string[] = AI_ACTIONS;

// Companion card/sheet message — derived from the day's own content rather
// than 40 more hand-authored per-stage strings, so it stays specific to
// today without a second huge content-authoring pass.
export function companionMessage(stage: LentStage, entry: LentDay | undefined, nextEntry: LentDay | undefined): string {
  if (!entry) return "";
  const c = entry.ml;
  switch (stage) {
    case "read":
      return `${c.themeTitle}.\nദൈവത്തിന്റെ വാഗ്ദാനത്തിലേക്ക് നോക്കാം.\n\n“${c.reading.text}” — ${c.reading.reference}`;
    case "pray":
      return `വചനം വായിച്ചു കഴിഞ്ഞു. ഇനി വാക്കുകൾ കുറയ്ക്കാം.\nഒരു നിമിഷം ദൈവസന്നിധിയിൽ നിശ്ശബ്ദമായി നിൽക്കാം:\n\n“${c.prayer}”`;
    case "act":
      return `വിശ്വാസം ഹൃദയത്തിൽ മാത്രം നിൽക്കേണ്ടതല്ല.\nഇന്ന് ഒരു ചെറിയ പ്രവർത്തി മതി:\n\n${c.activity}`;
    case "reflect":
      return `ഒരു ചിന്ത:\n\n“${c.reflection || "…"}”\n\nഇനി സ്വയം ചോദിക്കാമോ?\n“${c.reflectionQuestion || "…"}”`;
    case "michael":
      return "ഇന്ന് അവസാനമായി, വിശുദ്ധ മിഖായേലിനോട് ഒരുമിച്ച് പ്രാർത്ഥിക്കാം.\nഇത് ഓരോ ദിവസവും ഈ യാത്രയെ കാക്കുന്ന ഒരു കവചമാണ്.";
    case "done":
      return nextEntry
        ? `നീ ഇന്നത്തെ ദിനം മുഴുവൻ പൂർത്തിയാക്കി.\nനാളെ ${nextEntry.day}-ാം ദിനം — ${nextEntry.ml.themeTitle}.`
        : "നീ ഇന്നത്തെ ദിനം മുഴുവൻ പൂർത്തിയാക്കി.\nയാത്ര ഇവിടെ പൂർത്തിയായി — വിജയം ക്രിസ്തുവിന്റേതാണ്.";
  }
}
