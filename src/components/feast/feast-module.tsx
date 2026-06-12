"use client";

import { useState, useRef, useEffect } from "react";
import type { CMLTheme } from "@/lib/theme";
import { Blobs } from "@/components/home/blobs";
import { buildFeastTheme, FeastNav } from "./feast-shared";
import { FeastLanding } from "./feast-landing";
import { FeastDetails } from "./feast-details";
import { FeastRegister } from "./feast-register";
import type { RegResult } from "./feast-register";
import { FeastSuccess } from "./feast-success";
import { FeastResults } from "./feast-results";
import { FeastLeaderboard } from "./feast-leaderboard";
import { FeastParticipants } from "./feast-participants";
import { FeastRegistrations } from "./feast-registrations";
import { FeastEditRegister } from "./feast-edit-register";

type Screen = "landing" | "details" | "register" | "success" | "results" | "leaderboard" | "participants" | "registrations" | "edit-registration";

export function FeastModule({ onExit, parentTheme }: { onExit: () => void; parentTheme: CMLTheme }) {
  const theme = buildFeastTheme(parentTheme);
  const [screen, setScreen] = useState<Screen>("landing");
  const [feastSlug, setFeastSlug] = useState("literature-feast-2026");
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
    : ["details", "register", "success"].includes(screen)
      ? "landing"
      : screen;

  let body: React.ReactNode;
  switch (screen) {
    case "landing":
      body = <FeastLanding theme={theme} onExit={onExit} onOpen={(slug) => go("details", slug)} onSearch={() => setScreen("participants")} />;
      break;
    case "details":
      body = <FeastDetails slug={feastSlug} theme={theme} onBack={() => setScreen("landing")} onExit={onExit} go={go} />;
      break;
    case "register":
      body = <FeastRegister slug={feastSlug} theme={theme} onBack={() => setScreen("details")} onExit={onExit} onDone={(r) => { setRegResult(r); setScreen("success"); }} />;
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
      body = <FeastRegistrations slug={feastSlug} theme={theme} onBack={() => setScreen("details")} onExit={onExit} onEdit={(id) => { setEditParticipantId(id); setScreen("edit-registration"); }} />;
      break;
    case "edit-registration":
      body = <FeastEditRegister slug={feastSlug} participantId={editParticipantId!} theme={theme} onBack={() => setScreen("registrations")} onDone={() => setScreen("registrations")} onExit={onExit} />;
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
