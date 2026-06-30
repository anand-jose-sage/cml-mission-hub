"use client";

import { useRouter } from "next/navigation";
import { GlassPanel, type FeastTheme } from "@/components/feast/feast-shared";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/competition-categories";
import { TutorialPage } from "../_components/tutorial-page";
import { DEMO_PARTICIPANT, DEMO_COMPETITIONS, DEMO_SELECTED_IDS } from "../_data/demo";
import { useTutorialTheme } from "../_hooks/use-tutorial-theme";
import { useTutorialTour } from "../_hooks/use-tutorial-tour";
import { REVIEW_TOUR } from "../_data/review-tour";

function Row({ k, v, theme, accent, dataTour }: { k: string; v: string; theme: FeastTheme; accent?: string; dataTour?: string }) {
  return (
    <div
      data-tour={dataTour}
      className="flex justify-between items-center py-2.5"
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

export default function ReviewStep() {
  const theme = useTutorialTheme();
  const router = useRouter();
  const p = DEMO_PARTICIPANT;
  const selectedComps = DEMO_COMPETITIONS.filter((c) => DEMO_SELECTED_IDS.includes(c.id));
  const genderLabel = p.gender.charAt(0).toUpperCase() + p.gender.slice(1);
  useTutorialTour(REVIEW_TOUR, {
    onComplete: () => router.push("/help/tutorials/registration/success"),
    doneBtnText: "Next",
  });

  return (
    <TutorialPage
      title="Review Registration"
      subtitle="Confirm everything looks right before submitting."
      theme={theme}
    >
      <GlassPanel theme={theme} strong style={{ padding: 18, marginBottom: 14 }}>
        <div
          data-tour="review-summary"
          className="font-semibold text-[11px] uppercase tracking-wider mb-3"
          style={{ fontFamily: "var(--font-poppins), sans-serif", color: theme.gold }}
        >
          Confirm your details
        </div>
        <Row k="Name"          v={p.name}                       theme={theme} />
        <Row k="House Name"    v={p.houseName}                  theme={theme} />
        <Row k="Date of Birth" v={p.dob}                        theme={theme} />
        <Row k="Gender"        v={genderLabel}                  theme={theme} />
        <Row k="Category"      v={CATEGORY_LABELS[p.category]}  theme={theme} accent={CATEGORY_COLORS[p.category]} dataTour="review-category" />
        <Row k="Shakha"        v={p.shakha.name}                theme={theme} />
        <Row k="Phone"         v={p.phone}                      theme={theme} />
        <div data-tour="review-comps" className="mt-3">
          <div className="text-[12.5px] mb-2" style={{ color: theme.faint }}>
            Competitions ({selectedComps.length})
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
      <p className="text-center text-[11.5px]" style={{ color: theme.faint }}>
        Registering under <strong>{p.shakha.name}</strong>
      </p>
    </TutorialPage>
  );
}
