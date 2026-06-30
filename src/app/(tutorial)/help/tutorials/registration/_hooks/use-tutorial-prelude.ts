"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { DriveStep } from "driver.js";
import type {
  FeastModuleTutorialStep,
} from "@/components/feast/feast-module";
import type {
  FeastDetailsTutorial,
  LoginTutorialPhase,
} from "@/components/feast/feast-details";
import { useTutorialTour } from "./use-tutorial-tour";
import {
  HOME_TOUR,
  LANDING_TOUR,
  DETAILS_PRELUDE_TOUR,
  REGISTER_HOME_TOUR,
} from "../_data/prelude-tours";

const TUTORIAL_PARAM = "registration";
const STEP_CHANGE_EVENT = "tutorial:step-changed";

export type PreludeStep = "home" | "landing" | "details" | "login" | "register-home";

function readUrlStep(): PreludeStep | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  if (params.get("tutorial") !== TUTORIAL_PARAM) return null;
  const raw = params.get("step");
  const allowed: PreludeStep[] = ["home", "landing", "details", "login", "register-home"];
  return (allowed as string[]).includes(raw ?? "") ? (raw as PreludeStep) : "home";
}

function advanceUrl(next: PreludeStep) {
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

export interface PreludeState {
  active: boolean;
  inFeast: boolean;
  feastStep: FeastModuleTutorialStep | null;
  feastDetails: FeastDetailsTutorial | null;
}

export function useTutorialPrelude(): PreludeState {
  const router = useRouter();
  const [step, setStep] = useState<PreludeStep | null>(null);
  const [loginPhase, setLoginPhase] = useState<LoginTutorialPhase>("idle");
  const [loggedIn, setLoggedIn] = useState(false);

  // Track URL → step
  useEffect(() => {
    const sync = () => {
      const next = readUrlStep();
      setStep(next);
      if (next === null) {
        setLoggedIn(false);
        setLoginPhase("idle");
      } else if (next === "register-home") {
        setLoggedIn(true);
        setLoginPhase("idle");
      } else if (next !== "login") {
        setLoginPhase("idle");
      }
    };
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener(STEP_CHANGE_EVENT, sync as EventListener);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener(STEP_CHANGE_EVENT, sync as EventListener);
    };
  }, []);

  // Keep a stable ref to setLoginPhase so memoized step arrays don't re-create
  const setLoginPhaseRef = useRef(setLoginPhase);
  useEffect(() => { setLoginPhaseRef.current = setLoginPhase; });

  // Memoized step arrays — stable per `step` value
  const steps = useMemo<DriveStep[]>(() => {
    if (step === "home") return HOME_TOUR;
    if (step === "landing") return LANDING_TOUR;
    if (step === "details") return DETAILS_PRELUDE_TOUR;
    if (step === "register-home") return REGISTER_HOME_TOUR;
    if (step === "login") {
      return [
        {
          element: '[data-tour="login-email"]',
          popover: { title: "Email", description: "Enter the admin email used to sign in.", side: "bottom", align: "start" },
          onHighlightStarted: () => setLoginPhaseRef.current("typing-email"),
        },
        {
          element: '[data-tour="login-password"]',
          popover: { title: "Password", description: "Enter the matching password.", side: "bottom", align: "start" },
          onHighlightStarted: () => setLoginPhaseRef.current("typing-password"),
        },
        {
          element: '[data-tour="login-submit"]',
          popover: { title: "Sign in", description: "Tap Sign In to authenticate. In this tutorial no real request is made.", side: "top", align: "center" },
          onHighlightStarted: () => setLoginPhaseRef.current("ready"),
        },
      ];
    }
    return [];
  }, [step]);

  const onComplete = useCallback(() => {
    if (step === "home") advanceUrl("landing");
    else if (step === "landing") advanceUrl("details");
    else if (step === "details") advanceUrl("login");
    else if (step === "login") setLoginPhase("submitting");
    else if (step === "register-home") {
      clearTutorialFromUrl();
      router.push("/help/tutorials/registration/details");
    }
  }, [step, router]);

  // Every sub-tour in the prelude hands off to another screen — never use "Finish" here.
  useTutorialTour(steps, { onComplete, doneBtnText: "Next" });

  const feastStep: FeastModuleTutorialStep | null =
    step === "landing" ? "landing"
    : step === "details" ? "details"
    : step === "login" ? "login"
    : step === "register-home" ? "register-home"
    : null;

  const feastDetails: FeastDetailsTutorial | null = step && step !== "home" ? {
    loggedIn: step === "register-home",
    loginOpen: step === "login",
    loginPhase,
    onLoginClose: () => { /* sheet stays open during tutorial */ },
    onTutorialSubmit: () => {
      setLoggedIn(true);
      advanceUrl("register-home");
    },
  } : null;

  // Avoid unused-var lint for loggedIn (kept for potential debugging visibility)
  void loggedIn;

  return {
    active: step !== null,
    inFeast: step !== null && step !== "home",
    feastStep,
    feastDetails,
  };
}
