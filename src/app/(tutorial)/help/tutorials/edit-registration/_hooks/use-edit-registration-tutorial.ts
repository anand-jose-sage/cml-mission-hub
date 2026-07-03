"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DriveStep } from "driver.js";
import type { FeastModuleTutorialStep } from "@/components/feast/feast-module";
import { useTutorialTour } from "../../registration/_hooks/use-tutorial-tour";
import { PICK_TOUR, FORM_GUIDING_TOUR, DONE_TOUR } from "../_data/tours";

const TUTORIAL_PARAM = "edit-registration";
const STEP_CHANGE_EVENT = "edit-registration-tutorial:step-changed";

type Phase = "pick" | "form" | "done";

function readUrlStep(): Phase | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  if (params.get("tutorial") !== TUTORIAL_PARAM) return null;
  const raw = params.get("step");
  const allowed: Phase[] = ["pick", "form", "done"];
  return (allowed as string[]).includes(raw ?? "") ? (raw as Phase) : "pick";
}

function advanceUrl(next: Phase) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  params.set("tutorial", TUTORIAL_PARAM);
  params.set("step", next);
  const url = `${window.location.pathname}?${params.toString()}`;
  window.history.pushState({}, "", url);
  window.dispatchEvent(new Event(STEP_CHANGE_EVENT));
}

function clearTutorialFromUrl() {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  params.delete("tutorial");
  params.delete("step");
  const qs = params.toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState({}, "", url);
  window.dispatchEvent(new Event(STEP_CHANGE_EVENT));
}

export interface EditRegistrationTutorialState {
  active: boolean;
  inFeast: boolean;
  feastStep: FeastModuleTutorialStep | null;
  feastDetails: null;
  onTutorialAction: (action: string) => void;
}

export function useEditRegistrationTutorial(): EditRegistrationTutorialState {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase | null>(null);
  const [formSubPhase, setFormSubPhase] = useState<"guiding" | "waiting-save">("guiding");

  useEffect(() => {
    const sync = () => {
      const next = readUrlStep();
      setPhase(next);
      if (next !== "form") setFormSubPhase("guiding");
    };
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener(STEP_CHANGE_EVENT, sync as EventListener);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener(STEP_CHANGE_EVENT, sync as EventListener);
    };
  }, []);

  const steps = useMemo<DriveStep[]>(() => {
    if (phase === "pick") return PICK_TOUR;
    if (phase === "form") return formSubPhase === "guiding" ? FORM_GUIDING_TOUR : [];
    if (phase === "done") return DONE_TOUR;
    return [];
  }, [phase, formSubPhase]);

  const onComplete = useCallback(() => {
    if (phase === "done") {
      clearTutorialFromUrl();
      router.push("/");
    }
  }, [phase, router]);

  // Every sub-tour here (except "done") hands off on a real interaction, not the popover's own
  // Finish/Next click — see onTutorialAction below.
  useTutorialTour(steps, { onComplete });

  const onTutorialAction = useCallback((action: string) => {
    if (phase === "pick" && action === "edit-tap") advanceUrl("form");
    else if (phase === "form" && formSubPhase === "guiding" && action === "continue-tap") setFormSubPhase("waiting-save");
    else if (phase === "form" && formSubPhase === "waiting-save" && action === "save-success") advanceUrl("done");
  }, [phase, formSubPhase]);

  const feastStep: FeastModuleTutorialStep | null =
    phase === "pick" ? "my-registrations"
    : phase === "form" ? "edit-registration-form"
    : phase === "done" ? "my-registrations"
    : null;

  return {
    active: phase !== null,
    inFeast: phase !== null,
    feastStep,
    feastDetails: null,
    onTutorialAction,
  };
}
