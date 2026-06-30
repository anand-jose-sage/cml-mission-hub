import type { DriveStep } from "driver.js";

export const COMPETITIONS_TOUR: DriveStep[] = [
  {
    element: '[data-tour="comp-first"]',
    popover: {
      title: "Competition cards",
      description: "Each card is an event the participant is eligible for. Tap a card to select or deselect it.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="comp-gendered"]',
    popover: {
      title: "Gender & category badges",
      description: "Some competitions are restricted to Boys or Girls and to specific age categories. Only eligible ones are shown.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="selected-count"]',
    popover: {
      title: "Selected count",
      description: "This counter updates as you pick competitions. There's no hard limit — pick as many as you want.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="next-button"]',
    popover: {
      title: "Continue to review",
      description: "When you're done picking, tap Next to review the registration before submitting.",
      side: "top",
      align: "end",
    },
  },
];
