"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { GlassPanel, FeastIcon, type FeastTheme } from "@/components/feast/feast-shared";
import { CATEGORY_LABELS } from "@/lib/competition-categories";
import { TutorialPage } from "../_components/tutorial-page";
import { DEMO_COMPETITIONS, DEMO_SELECTED_IDS, DEMO_FEAST, type DemoCompetition } from "../_data/demo";
import { useTutorialTheme } from "../_hooks/use-tutorial-theme";
import { useTutorialTour } from "../_hooks/use-tutorial-tour";
import { COMPETITIONS_TOUR } from "../_data/competitions-tour";

function CompCard({ comp, selected, theme, dataTour }: { comp: DemoCompetition; selected: boolean; theme: FeastTheme; dataTour?: string }) {
  const genderColor = comp.gender === "boys" ? "#3B82F6" : comp.gender === "girls" ? "#EC4899" : null;
  return (
    <motion.div
      data-tour={dataTour}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.18, ease: [0.2, 0.8, 0.3, 1] }}
    >
      <GlassPanel
        theme={theme}
        style={{
          padding: "12px 14px",
          marginBottom: 9,
          display: "flex",
          alignItems: "center",
          gap: 12,
          border: selected ? `1px solid ${theme.lavender}` : theme.glass.border,
          boxShadow: selected ? `0 0 0 3px ${theme.purple}2e, ${theme.softShadow}` : theme.softShadow,
        }}
      >
        <div
          className="w-9 h-9 rounded-[10px] flex-shrink-0 flex items-center justify-center"
          style={{ background: DEMO_FEAST.accent + "26" }}
        >
          <FeastIcon name={comp.icon} size={17} color={theme.lavender} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="font-semibold text-[13.5px]"
            style={{ fontFamily: "var(--font-poppins), sans-serif", color: theme.text }}
          >
            {comp.name}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-[11px]" style={{ color: theme.sub }}>
              {comp.cat} · {comp.time}
            </span>
            {genderColor && (
              <span
                className="text-[10px] font-semibold px-1.5 py-px rounded-full"
                style={{ background: genderColor + "1a", color: genderColor, border: `1px solid ${genderColor}33` }}
              >
                {comp.gender === "boys" ? "Boys" : "Girls"}
              </span>
            )}
            {comp.categorySlug && (
              <span
                className="text-[10px] font-semibold px-1.5 py-px rounded-full"
                style={{ background: theme.purple + "1a", color: theme.purple, border: `1px solid ${theme.purple}33` }}
              >
                {CATEGORY_LABELS[comp.categorySlug]}
              </span>
            )}
          </div>
        </div>
        <div
          className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center"
          style={{
            background: selected ? "linear-gradient(135deg,#6B46FF,#A78BFA)" : "rgba(255,255,255,0.72)",
            border: selected ? "none" : `1px solid ${theme.hairline}`,
          }}
        >
          {selected && <Check size={15} color="#fff" />}
        </div>
      </GlassPanel>
    </motion.div>
  );
}

export default function CompetitionsStep() {
  const theme = useTutorialTheme();
  const router = useRouter();
  const selectedCount = DEMO_SELECTED_IDS.length;
  useTutorialTour(COMPETITIONS_TOUR, {
    onComplete: () => router.push("/help/tutorials/registration/review"),
    doneBtnText: "Next",
  });
  return (
    <TutorialPage
      title="Competition Selection"
      subtitle="Showing competitions for your category. Select the ones you'd like to enter."
      theme={theme}
    >
      {DEMO_COMPETITIONS.map((c, i) => {
        const dataTour =
          i === 0 ? "comp-first"
          : c.gender === "girls" || c.gender === "boys" ? "comp-gendered"
          : undefined;
        return (
          <CompCard
            key={c.id}
            comp={c}
            selected={DEMO_SELECTED_IDS.includes(c.id)}
            theme={theme}
            dataTour={dataTour}
          />
        );
      })}
      <div
        data-tour="selected-count"
        className="flex items-center justify-between mt-3.5 mb-3 px-0.5"
      >
        <span className="text-[13px]" style={{ color: theme.sub }}>Selected</span>
        <span
          className="font-bold text-[15px]"
          style={{ fontFamily: "var(--font-poppins), sans-serif", color: theme.text }}
        >
          {selectedCount} event{selectedCount !== 1 ? "s" : ""}
        </span>
      </div>
    </TutorialPage>
  );
}
