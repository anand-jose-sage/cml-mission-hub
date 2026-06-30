import type { DriveStep } from "driver.js";

export const REVIEW_TOUR: DriveStep[] = [
  {
    element: '[data-tour="review-summary"]',
    popover: {
      title: "Confirm the details",
      description: "Everything entered so far is listed here. This is your last chance to spot mistakes before saving.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="review-category"]',
    popover: {
      title: "Category & shakha",
      description: "The category is derived from the date of birth, and the shakha is your admin shakha — both are filled in automatically.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="review-comps"]',
    popover: {
      title: "Selected competitions",
      description: "Every competition the participant will compete in. To add or remove any, tap Back to step 2.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="next-button"]',
    popover: {
      title: "Confirm registration",
      description: "Tap Next to save the registration. The participant will get a unique registration number.",
      side: "top",
      align: "end",
    },
  },
];
