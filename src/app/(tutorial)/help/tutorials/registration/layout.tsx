"use client";

import "driver.js/dist/driver.css";
import "./_components/tutorial-driver.css";

import { type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { Check } from "lucide-react";
import { Blobs } from "@/components/home/blobs";
import { FeastTopBar, GlowBtn, type FeastTheme } from "@/components/feast/feast-shared";
import { useTutorialTheme } from "./_hooks/use-tutorial-theme";

const STEPS = [
  { slug: "details",      label: "Details" },
  { slug: "competitions", label: "Events" },
  { slug: "review",       label: "Review" },
  { slug: "success",      label: "Done" },
] as const;

const BASE = "/help/tutorials/registration";
const EASE = [0.2, 0.8, 0.3, 1] as const;

function ProgressIndicator({ stepIndex, theme }: { stepIndex: number; theme: FeastTheme }) {
  return (
    <div
      role="progressbar"
      aria-label="Tutorial progress"
      aria-valuemin={1}
      aria-valuemax={STEPS.length}
      aria-valuenow={stepIndex + 1}
      aria-valuetext={`Step ${stepIndex + 1} of ${STEPS.length}: ${STEPS[stepIndex]?.label}`}
      className="flex items-center gap-1.5 mb-[18px] px-5"
    >
      {STEPS.map((s, i) => {
        const done = i < stepIndex;
        const active = i === stepIndex;
        return (
          <div key={s.slug} className="contents">
            <div className="flex items-center gap-[7px]">
              <motion.div
                className="w-[26px] h-[26px] rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[12px]"
                animate={{
                  scale: active ? 1.06 : 1,
                  boxShadow: active ? "0 6px 16px rgba(107,70,255,0.4)" : "0 0px 0px rgba(107,70,255,0)",
                }}
                transition={{ duration: 0.32, ease: EASE }}
                style={{
                  fontFamily: "var(--font-poppins), sans-serif",
                  background: done || active ? "linear-gradient(135deg, #6B46FF, #A78BFA)" : theme.fillStrong,
                  color: done || active ? "#fff" : theme.faint,
                }}
              >
                {done ? <Check size={14} color="#fff" aria-hidden="true" /> : i + 1}
              </motion.div>
              <span
                className="text-[11.5px]"
                style={{
                  fontWeight: active ? 700 : 500,
                  color: active ? theme.text : theme.faint,
                  fontFamily: "var(--font-poppins), sans-serif",
                }}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                aria-hidden="true"
                className="flex-1 h-0.5 rounded relative overflow-hidden"
                style={{ background: theme.track }}
              >
                <motion.div
                  className="absolute inset-y-0 left-0 rounded"
                  initial={false}
                  animate={{ width: i < stepIndex ? "100%" : "0%" }}
                  transition={{ duration: 0.42, ease: EASE }}
                  style={{ background: theme.lavender }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function NavBtn({
  variant, label, icon, iconRight, disabled, onClick, dataTour,
}: {
  variant: "ghost" | "primary";
  label: string;
  icon?: string;
  iconRight?: string;
  disabled?: boolean;
  onClick?: () => void;
  dataTour?: string;
}) {
  if (disabled) {
    return (
      <div className="flex-1">
        <GlowBtn variant={variant} full icon={icon} iconRight={iconRight} disabled>{label}</GlowBtn>
      </div>
    );
  }
  return (
    <motion.div
      className="flex-1"
      data-tour={dataTour}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.18, ease: EASE }}
    >
      <GlowBtn variant={variant} full icon={icon} iconRight={iconRight} onClick={onClick}>{label}</GlowBtn>
    </motion.div>
  );
}

export default function TutorialLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTutorialTheme();

  const stepIndex = Math.max(
    0,
    STEPS.findIndex((s) => pathname?.endsWith(`/${s.slug}`)),
  );
  const prev = stepIndex > 0 ? `${BASE}/${STEPS[stepIndex - 1].slug}` : null;
  const next = stepIndex < STEPS.length - 1 ? `${BASE}/${STEPS[stepIndex + 1].slug}` : null;
  const isLast = stepIndex === STEPS.length - 1;

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="relative h-dvh w-full overflow-hidden max-w-md mx-auto"
        style={{ background: theme.pageBg }}
      >
        <Blobs mode={theme.blobs} />

        <main
          aria-label="Registration tutorial"
          className="relative h-full overflow-y-auto overflow-x-hidden pt-3 pb-[110px] scrollbar-hide"
        >
          <div className="px-5">
            <FeastTopBar
              title="Registration Tutorial"
              onExit={() => router.push("/")}
              theme={theme}
            />
          </div>
          <ProgressIndicator stepIndex={stepIndex} theme={theme} />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: EASE }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <nav
          aria-label="Tutorial navigation"
          className="absolute left-0 right-0 bottom-0 z-40 px-3.5 pb-[22px] pointer-events-none"
        >
          <div
            className="pointer-events-auto flex items-center gap-2.5 rounded-[26px] p-2.5"
            style={{
              background: theme.navBg,
              border: "1px solid rgba(255,255,255,0.6)",
              boxShadow: "0 12px 34px rgba(30,27,75,0.18)",
              backdropFilter: "blur(22px) saturate(180%)",
              WebkitBackdropFilter: "blur(22px) saturate(180%)",
            }}
          >
            <NavBtn
              variant="ghost"
              label="Back"
              icon="ArrowLeft"
              disabled={!prev}
              onClick={prev ? () => router.push(prev) : undefined}
            />
            <NavBtn
              variant="primary"
              label={isLast ? "Finish" : "Next"}
              iconRight={isLast ? "LogOut" : "ArrowRight"}
              dataTour="next-button"
              onClick={() => router.push(isLast ? "/" : next!)}
            />
          </div>
        </nav>
      </div>
    </MotionConfig>
  );
}
