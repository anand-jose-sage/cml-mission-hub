"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DriveStep } from "driver.js";
import type { FeastModuleTutorialStep } from "@/components/feast/feast-module";
import { useTutorialTour } from "../../registration/_hooks/use-tutorial-tour";
import { DETAILS_TOUR, REGISTRATIONS_TOUR } from "../_data/tours";

const TUTORIAL_PARAM = "my-registrations";
const STEP_CHANGE_EVENT = "my-registrations-tutorial:step-changed";

type Step = "details" | "registrations";

function readUrlStep(): Step | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  if (params.get("tutorial") !== TUTORIAL_PARAM) return null;
  const raw = params.get("step");
  const allowed: Step[] = ["details", "registrations"];
  return (allowed as string[]).includes(raw ?? "") ? (raw as Step) : "details";
}

function advanceUrl(next: Step) {
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

export interface MyRegistrationsTutorialState {
  active: boolean;
  inFeast: boolean;
  feastStep: FeastModuleTutorialStep | null;
  feastDetails: null;
}

export function useMyRegistrationsTutorial(): MyRegistrationsTutorialState {
  const router = useRouter();
  const [step, setStep] = useState<Step | null>(null);

  useEffect(() => {
    const sync = () => setStep(readUrlStep());
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener(STEP_CHANGE_EVENT, sync as EventListener);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener(STEP_CHANGE_EVENT, sync as EventListener);
    };
  }, []);

  const steps = useMemo<DriveStep[]>(() => {
    if (step === "details") return DETAILS_TOUR;
    if (step === "registrations") return REGISTRATIONS_TOUR;
    return [];
  }, [step]);

  const onComplete = useCallback(() => {
    if (step === "details") advanceUrl("registrations");
    else if (step === "registrations") {
      clearTutorialFromUrl();
      router.push("/");
    }
  }, [step, router]);

  useTutorialTour(steps, { onComplete, doneBtnText: step === "details" ? "Next" : "Finish" });

  const feastStep: FeastModuleTutorialStep | null =
    step === "details" ? "my-registrations-details"
    : step === "registrations" ? "my-registrations"
    : null;

  return {
    active: step !== null,
    inFeast: step !== null,
    feastStep,
    feastDetails: null,
  };
}
