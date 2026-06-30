"use client";

import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { GlassPanel, type FeastTheme } from "@/components/feast/feast-shared";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/competition-categories";
import { TutorialPage } from "../_components/tutorial-page";
import { DEMO_PARTICIPANT, DEMO_COMPETITIONS, DEMO_SELECTED_IDS, DEMO_FEAST, DEMO_REG_NO } from "../_data/demo";
import { useTutorialTheme } from "../_hooks/use-tutorial-theme";
import { useTutorialTour } from "../_hooks/use-tutorial-tour";
import { SUCCESS_TOUR } from "../_data/success-tour";

function Row({ k, v, theme, accent }: { k: string; v: string; theme: FeastTheme; accent?: string }) {
  return (
    <div
      className="flex justify-between py-2"
      style={{ borderBottom: `1px solid ${theme.hairline}` }}
    >
      <span className="text-[12.5px]" style={{ color: theme.faint }}>{k}</span>
      <span
        className="text-[13.5px] font-semibold"
        style={{ fontFamily: "var(--font-poppins), sans-serif", color: accent || theme.text }}
      >
        {v}
      </span>
    </div>
  );
}

export default function SuccessStep() {
  const theme = useTutorialTheme();
  const router = useRouter();
  const p = DEMO_PARTICIPANT;
  const selectedComps = DEMO_COMPETITIONS.filter((c) => DEMO_SELECTED_IDS.includes(c.id));
  const genderLabel = p.gender.charAt(0).toUpperCase() + p.gender.slice(1);
  useTutorialTour(SUCCESS_TOUR, {
    onComplete: () => router.push("/"),
  });

  return (
    <TutorialPage theme={theme}>
      <div data-tour="success-hero" className="text-center pt-4">
        <div
          className="w-[84px] h-[84px] rounded-full mx-auto flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #34D3AE, #16A34A)",
            boxShadow: "0 14px 38px rgba(34,197,94,0.5)",
          }}
        >
          <Check size={42} color="#fff" strokeWidth={3} />
        </div>
        <h2
          className="font-semibold text-[24px] mt-[18px] mb-1.5 tracking-tight"
          style={{ fontFamily: "var(--font-anek), sans-serif", color: theme.text }}
        >
          You&apos;re registered!
        </h2>
        <p className="text-[13.5px] leading-relaxed mx-auto max-w-[280px]" style={{ color: theme.sub }}>
          Welcome to <strong style={{ color: theme.text }}>{DEMO_FEAST.name} {DEMO_FEAST.year}</strong>.
        </p>
        <div
          data-tour="reg-no"
          className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full"
          style={{ background: theme.purple + "1a", border: `1px solid ${theme.purple}33` }}
        >
          <span className="text-[11px] uppercase tracking-wider" style={{ color: theme.faint }}>Reg №</span>
          <span
            className="text-[13px] font-bold tabular-nums"
            style={{ fontFamily: "var(--font-poppins), sans-serif", color: theme.purple }}
          >
            {DEMO_REG_NO}
          </span>
        </div>
      </div>

      <div data-tour="success-summary">
        <GlassPanel theme={theme} style={{ padding: 16, marginTop: 14 }}>
          <Row k="Participant"   v={p.name}                       theme={theme} />
          <Row k="House Name"    v={p.houseName}                  theme={theme} />
          <Row k="Shakha"        v={p.shakha.name}                theme={theme} />
          <Row k="Date of Birth" v={p.dob}                        theme={theme} />
          <Row k="Gender"        v={genderLabel}                  theme={theme} />
          <Row k="Category"      v={CATEGORY_LABELS[p.category]}  theme={theme} accent={CATEGORY_COLORS[p.category]} />
          <Row k="Phone"         v={p.phone}                      theme={theme} />
          <div className="mt-3">
            <div className="text-[12.5px] mb-2" style={{ color: theme.faint }}>
              Your competitions ({selectedComps.length})
            </div>
            <div className="flex flex-wrap gap-[7px]">
              {selectedComps.map((c) => (
                <span
                  key={c.id}
                  className="font-semibold text-[11.5px] px-[11px] py-1.5 rounded-full"
                  style={{
                    fontFamily: "var(--font-poppins), sans-serif",
                    color: theme.text,
                    background: theme.purple + "2e",
                    border: `1px solid ${theme.purple}55`,
                  }}
                >
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        </GlassPanel>
      </div>
    </TutorialPage>
  );
}
