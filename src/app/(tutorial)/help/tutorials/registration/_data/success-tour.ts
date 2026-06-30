import type { DriveStep } from "driver.js";

export const SUCCESS_TOUR: DriveStep[] = [
  {
    element: '[data-tour="success-hero"]',
    popover: {
      title: "Registration complete",
      description: "The participant has been added to the feast. A confirmation card appears here.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: '[data-tour="reg-no"]',
    popover: {
      title: "Registration number",
      description: "A unique number is assigned to every registration. Share this with the participant for reference at the venue.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: '[data-tour="success-summary"]',
    popover: {
      title: "Saved details",
      description: "All the entered details are saved with the registration. You can search by name or registration number from the Participants screen.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="next-button"]',
    popover: {
      title: "All done",
      description: "Tap Finish to return to the Mission Hub. That's the entire registration flow.",
      side: "top",
      align: "end",
    },
  },
];
