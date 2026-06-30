"use client";

import { useEffect, useRef } from "react";
import type { DriveStep, Driver } from "driver.js";

interface UseTutorialTourOptions {
  onComplete?: () => void;
}

export function useTutorialTour(steps: DriveStep[], opts?: UseTutorialTourOptions) {
  const onCompleteRef = useRef(opts?.onComplete);
  useEffect(() => {
    onCompleteRef.current = opts?.onComplete;
  }, [opts?.onComplete]);

  useEffect(() => {
    let cancelled = false;
    let d: Driver | null = null;

    const timer = setTimeout(async () => {
      if (cancelled) return;
      const { driver } = await import("driver.js");
      if (cancelled) return;

      d = driver({
        steps,
        showProgress: true,
        progressText: "Step {{current}} of {{total}}",
        allowClose: true,
        smoothScroll: true,
        overlayColor: "rgba(30, 27, 75, 0.72)",
        stagePadding: 8,
        stageRadius: 18,
        popoverClass: "tutorial-popover",
        nextBtnText: "Next",
        prevBtnText: "Back",
        doneBtnText: "Finish",
        onNextClick: (_el, _step, { state, driver: drv }) => {
          if (state.activeIndex === steps.length - 1) {
            drv.destroy();
            onCompleteRef.current?.();
          } else {
            drv.moveNext();
          }
        },
        onPopoverRender: (popover) => {
          if (popover.footer.querySelector(".tutorial-meta-actions")) return;
          const wrap = document.createElement("div");
          wrap.className = "tutorial-meta-actions";

          const skip = document.createElement("button");
          skip.type = "button";
          skip.className = "tutorial-skip-btn";
          skip.textContent = "Skip";
          skip.setAttribute("aria-label", "Skip tour");
          skip.addEventListener("click", () => d?.destroy());

          const restart = document.createElement("button");
          restart.type = "button";
          restart.className = "tutorial-restart-btn";
          restart.textContent = "Restart";
          restart.setAttribute("aria-label", "Restart tour from the first step");
          restart.addEventListener("click", () => d?.drive(0));

          wrap.appendChild(skip);
          wrap.appendChild(restart);
          popover.footer.insertBefore(wrap, popover.footer.firstChild);
        },
      });
      d.drive();
    }, 60);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      d?.destroy();
    };
  }, [steps]);
}
