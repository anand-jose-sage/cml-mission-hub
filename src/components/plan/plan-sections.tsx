import type { PlanMonth } from "@/types";
import { PLAN, monthAccent, tint } from "@/lib/plan-theme";

const ml = "font-[family-name:var(--font-poppins)]";   // Baloo Chettan 2 (Malayalam)
const head = "font-[family-name:var(--font-anek)]";    // Anek Malayalam

// ── Month theme hero (pinned to the very top of the Activities screen) ───────
export function MonthThemeHeader({ month }: { month: PlanMonth }) {
  const accent = monthAccent(month.index, month.accent);
  return (
    <div
      className="rounded-[20px] overflow-hidden"
      style={{ border: `1px solid ${tint(accent, 0.3)}`, boxShadow: "0 12px 28px rgba(176,90,60,0.12)" }}
    >
      <div
        className="px-4 pt-4 pb-4"
        style={{ background: `linear-gradient(135deg, ${tint(accent, 0.18)}, ${tint(accent, 0.08)})` }}
      >
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`${ml} text-[11px] font-bold px-2.5 py-1 rounded-full text-white`} style={{ background: accent }}>
            {month.monthMl} {month.monthEn.replace(/^\D+/, "")}
          </span>
          <span className={`${ml} text-[11px] font-semibold`} style={{ color: accent }}>{month.churchLine}</span>
        </div>

        <h2 className={`${head} font-bold text-[22px] leading-tight`} style={{ color: PLAN.ink }}>
          {month.actionTheme}
        </h2>

        {month.tagline && (
          <div className="mt-2.5 pl-3" style={{ borderLeft: `3px solid ${accent}` }}>
            <p className={`${ml} text-[14px] font-semibold italic`} style={{ color: accent }}>“{month.tagline}”</p>
          </div>
        )}

        {month.description && (
          <p className={`${ml} text-[13px] leading-relaxed mt-2.5`} style={{ color: PLAN.sub }}>
            {month.description}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Church-build progress card (shown above the calendar) ────────────────────
export function ChurchPartBar({ month }: { month: PlanMonth }) {
  const accent = monthAccent(month.index, month.accent);
  const { index, total, ml: partMl, en: partEn } = month.churchPart;
  return (
    <div
      className="rounded-[18px] px-4 py-3.5"
      style={{ background: PLAN.pageBg, border: `1px solid ${PLAN.line}`, boxShadow: "0 8px 22px rgba(120,90,60,0.10)" }}
    >
      <div className={`${ml} text-[11px] font-semibold`} style={{ color: PLAN.muted }}>ഈ മാസത്തെ ദേവാലയ ഭാഗം</div>
      <div className={`${ml} text-[15px] font-bold mt-0.5 mb-2`} style={{ color: PLAN.ink }}>
        {partMl} <span className="text-[11.5px] font-medium" style={{ color: PLAN.muted }}>{partEn}</span>
      </div>
      <div className="flex gap-[3px]">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className="flex-1 rounded-full" style={{ height: 8, background: i < index ? accent : tint(accent, 0.18) }} />
        ))}
      </div>
      <div className={`${ml} text-right text-[11px] font-semibold mt-1.5`} style={{ color: PLAN.muted }}>11-ൽ {index} ഭാഗം</div>
    </div>
  );
}

// ── Stones (virtue + small acts) ─────────────────────────────────────────────
export function MonthStones({ month }: { month: PlanMonth }) {
  const accent = monthAccent(month.index, month.accent);
  return (
    <div className="rounded-[18px] p-4" style={{ background: PLAN.pageBg, border: `1px solid ${PLAN.line}` }}>
      <div className="flex items-center justify-between mb-2.5">
        <span className={`${ml} text-[12px] font-semibold`} style={{ color: PLAN.muted }}>ഈ മാസത്തെ കല്ലുകൾ</span>
        <span className={`${ml} text-[11px] font-bold px-2.5 py-1 rounded-full text-white`} style={{ background: accent }}>
          സദ്ഗുണം · {month.virtue}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {month.stones.map((s, i) => (
          <span key={i} className={`${ml} text-[12px] font-medium px-2.5 py-1 rounded-lg`} style={{ background: PLAN.card, color: PLAN.ink, border: `1px solid ${PLAN.line}` }}>{s}</span>
        ))}
      </div>
    </div>
  );
}

// ── Common programs for the month ────────────────────────────────────────────
export function MonthPrograms({ month }: { month: PlanMonth }) {
  const accent = monthAccent(month.index, month.accent);
  return (
    <div className="rounded-[18px] p-4" style={{ background: PLAN.pageBg, border: `1px solid ${PLAN.line}` }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-5 rounded-full" style={{ background: accent }} />
        <div className={`${head} text-[15px] font-bold`} style={{ color: PLAN.ink }}>പ്രവർത്തനങ്ങൾ</div>
        <span className={`${ml} ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full`} style={{ background: tint(accent, 0.14), color: accent }}>
          {month.programs.length}
        </span>
      </div>
      <div className="space-y-2">
        {month.programs.map((p, i) => (
          <div key={i} className="rounded-[14px] p-3 flex gap-3" style={{ background: PLAN.card, border: `1px solid ${PLAN.line}` }}>
            <span className={`${ml} shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[12px] font-bold`} style={{ background: tint(accent, 0.15), color: accent }}>
              {i + 1}
            </span>
            <div className="min-w-0">
              <div className={`${ml} font-bold text-[14px] leading-snug`} style={{ color: PLAN.ink }}>{p.title}</div>
              <div className={`${ml} text-[12.5px] leading-relaxed mt-1`} style={{ color: PLAN.sub }}>{p.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
