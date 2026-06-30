"use client";

import { useRouter } from "next/navigation";
import { GlassPanel } from "@/components/feast/feast-shared";
import { TutorialPage } from "../_components/tutorial-page";
import {
  StaticField, StaticCategoryPill, StaticGenderChips, ShakhaRow,
} from "../_components/static-fields";
import { DEMO_PARTICIPANT } from "../_data/demo";
import { useTutorialTheme } from "../_hooks/use-tutorial-theme";
import { useTutorialTour } from "../_hooks/use-tutorial-tour";
import { DETAILS_TOUR } from "../_data/details-tour";

export default function DetailsStep() {
  const theme = useTutorialTheme();
  const router = useRouter();
  const p = DEMO_PARTICIPANT;
  useTutorialTour(DETAILS_TOUR, {
    onComplete: () => router.push("/help/tutorials/registration/competitions"),
  });
  return (
    <TutorialPage
      title="Registration Details"
      subtitle="മത്സരാർത്ഥിയുടെ പേര്, വീട്ടുപേര്, ജനന തിയ്യതി, ഫോൺ നമ്പർ എന്നിവ പൂരിപ്പിക്കുക.
ഫോൺ നമ്പർ നിർബന്ധമില്ല"
      theme={theme}
    >
      <GlassPanel theme={theme} style={{ padding: 16, marginBottom: 14 }}>
        <StaticField label="Full Name"     value={p.name}      theme={theme} icon="user"     dataTour="name" />
        <StaticField label="House Name"    value={p.houseName} theme={theme}                 dataTour="house-name" />
        <StaticField label="Date of Birth" value={p.dob}       theme={theme} icon="calendar" type="date" dataTour="dob" />
        <StaticCategoryPill slug={p.category} theme={theme} dataTour="category" />
        <StaticGenderChips value={p.gender} theme={theme} dataTour="gender" />
        <StaticField label="Phone (optional)" value={p.phone}  theme={theme} icon="phone"    type="tel" dataTour="phone" />
        <ShakhaRow name={p.shakha.name} theme={theme} dataTour="shakha" />
      </GlassPanel>
    </TutorialPage>
  );
}
