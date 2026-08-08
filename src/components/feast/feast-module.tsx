"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import type { CMLTheme } from "@/lib/theme";
import { Blobs } from "@/components/home/blobs";
import { buildFeastTheme, FeastNav } from "./feast-shared";
import type { FeastDetailsTutorial } from "./feast-details";
import type { RegResult } from "./feast-register";

export type FeastModuleTutorialStep = "landing" | "details" | "login" | "register-home" | "my-registrations-details" | "my-registrations" | "edit-registration-form";

const FeastLanding      = dynamic(() => import("./feast-landing").then(m => ({ default: m.FeastLanding })));
const FeastDetails      = dynamic(() => import("./feast-details").then(m => ({ default: m.FeastDetails })));
const FeastRegister     = dynamic(() => import("./feast-register").then(m => ({ default: m.FeastRegister })));
const FeastRegisterTeam = dynamic(() => import("./feast-register-team").then(m => ({ default: m.FeastRegisterTeam })));
const FeastSuccess      = dynamic(() => import("./feast-success").then(m => ({ default: m.FeastSuccess })));
const FeastResults      = dynamic(() => import("./feast-results").then(m => ({ default: m.FeastResults })));
const FeastLeaderboard  = dynamic(() => import("./feast-leaderboard").then(m => ({ default: m.FeastLeaderboard })));
const FeastParticipants = dynamic(() => import("./feast-participants").then(m => ({ default: m.FeastParticipants })));
const FeastRegistrations= dynamic(() => import("./feast-registrations").then(m => ({ default: m.FeastRegistrations })));
const FeastEditRegister = dynamic(() => import("./feast-edit-register").then(m => ({ default: m.FeastEditRegister })));

type Screen = "landing" | "details" | "register" | "register-team" | "success" | "results" | "leaderboard" | "participants" | "registrations" | "edit-registration";

export function FeastModule({
  onExit,
  parentTheme,
  tutorialStep,
  tutorialDetails,
  onTutorialAction,
  initialScreen,
  initialSlug,
}: {
  onExit: () => void;
  parentTheme: CMLTheme;
  tutorialStep?: FeastModuleTutorialStep;
  tutorialDetails?: FeastDetailsTutorial;
  onTutorialAction?: (action: string) => void;
  initialScreen?: Screen;
  initialSlug?: string;
}) {
  const theme = buildFeastTheme(parentTheme);
  const tutorialScreen: Screen | null = tutorialStep === "landing" ? "landing"
    : tutorialStep === "details" || tutorialStep === "login" || tutorialStep === "register-home" || tutorialStep === "my-registrations-details" ? "details"
    : tutorialStep === "my-registrations" ? "registrations"
    : tutorialStep === "edit-registration-form" ? "edit-registration"
    : null;
  const [internalScreen, setInternalScreen] = useState<Screen>(initialScreen ?? "landing");
  const screen: Screen = tutorialScreen ?? internalScreen;
  const setScreen = (s: Screen) => {
    if (tutorialScreen) return; // tutorial controls screen
    setInternalScreen(s);
  };
  const [feastSlug, setFeastSlug] = useState(initialSlug ?? "literature_2026");
  const [regResult, setRegResult] = useState<RegResult | null>(null);
  const [editParticipantId, setEditParticipantId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLElement>(null);

  const go = (s: string, slug?: string) => {
    if (slug) setFeastSlug(slug);
    setScreen(s as Screen);
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [screen, feastSlug]);

  const onNav = (id: string) => {
    if (id === "exit") return onExit();
    if (id === "landing") return setScreen("landing");
    setScreen(id as Screen);
  };

  const navActive = ["landing", "results", "leaderboard", "participants"].includes(screen)
    ? screen
    : ["details", "register", "register-team", "success"].includes(screen)
      ? "landing"
      : screen;

  let body: React.ReactNode;
  switch (screen) {
    case "landing":
      body = <FeastLanding theme={theme} onExit={onExit} onOpen={(slug) => go("details", slug)} onSearch={() => setScreen("participants")} />;
      break;
    case "details":
      body = <FeastDetails slug={feastSlug} theme={theme} onBack={() => setScreen("landing")} onExit={onExit} go={go} tutorial={tutorialDetails} />;
      break;
    case "register":
      body = <FeastRegister slug={feastSlug} theme={theme} onBack={() => setScreen("details")} onExit={onExit} onDone={(r) => { setRegResult(r); setScreen("success"); }} />;
      break;
    case "register-team":
      body = <FeastRegisterTeam slug={feastSlug} theme={theme} onBack={() => setScreen("details")} onExit={onExit} onDone={() => setScreen("details")} />;
      break;
    case "success":
      body = <FeastSuccess slug={feastSlug} theme={theme} result={regResult} onDone={() => setScreen("details")} onRegisterAnother={() => { setRegResult(null); setScreen("register"); }} />;
      break;
    case "results":
      body = <FeastResults slug={feastSlug} theme={theme} onBack={() => setScreen("details")} onExit={onExit} onSearchNav={() => setScreen("participants")} setFeastSlug={setFeastSlug} />;
      break;
    case "leaderboard":
      body = <FeastLeaderboard slug={feastSlug} theme={theme} onBack={() => setScreen("details")} onExit={onExit} setFeastSlug={setFeastSlug} />;
      break;
    case "participants":
      body = <FeastParticipants slug={feastSlug} theme={theme} onBack={() => setScreen("landing")} onExit={onExit} setFeastSlug={setFeastSlug} />;
      break;
    case "registrations":
      body = <FeastRegistrations slug={feastSlug} theme={theme} onBack={() => setScreen("details")} onExit={onExit} onEdit={(id) => { setEditParticipantId(id); setScreen("edit-registration"); onTutorialAction?.("edit-tap"); }} />;
      break;
    case "edit-registration":
      body = <FeastEditRegister slug={feastSlug} participantId={editParticipantId!} theme={theme} onBack={() => setScreen("registrations")} onDone={() => setScreen("registrations")} onExit={onExit} onTutorialAction={onTutorialAction} />;
      break;
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: theme.pageBg }}>
        <Blobs mode={theme.blobs} />
      </div>
      <main
        ref={scrollRef}
        className="relative h-full overflow-y-auto overflow-x-hidden pt-[50px] pb-[110px] scrollbar-hide"
      >
        {body}
      </main>
      <FeastNav active={navActive} onNav={onNav} theme={theme} />
    </div>
  );
}
