"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { buildTheme } from "@/lib/theme";
import { LentModule } from "@/components/lent/lent-module";

// Standalone client shell for the /lent route — same theme construction and
// full-bleed container as the inLent branch this replaced in src/app/page.tsx,
// just with a real URL to navigate to/from instead of client-only state.
export function LentPageClient() {
  const router = useRouter();
  const theme = useMemo(() => buildTheme("aurora-glass", "dusk", 28), []);

  return (
    <div className="relative h-dvh w-full overflow-hidden max-w-md mx-auto" style={{ background: theme.pageBg }}>
      <LentModule onExit={() => router.push("/")} parentTheme={theme} />
    </div>
  );
}
