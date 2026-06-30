import type { DriveStep } from "driver.js";

export const HOME_TOUR: DriveStep[] = [
  {
    element: '[data-tour="feast-portal-card"]',
    popover: {
      title: "Feast Portal",
      description: "This is the Feast Portal where all feast registrations, results and rankings are managed.",
      side: "bottom",
      align: "center",
    },
  },
];

export const LANDING_TOUR: DriveStep[] = [
  {
    element: '[data-tour="feast-listing-first"]',
    popover: {
      title: "Active feasts",
      description: "This page lists all active feast competitions for the current season.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="feast-listing-first-view-btn"]',
    popover: {
      title: "View Details",
      description: "Open this feast to see details and begin participant registration.",
      side: "top",
      align: "center",
    },
  },
];

export const DETAILS_PRELUDE_TOUR: DriveStep[] = [
  {
    element: '[data-tour="feast-info"]',
    popover: {
      title: "Feast information",
      description: "This page shows feast information, venue, date and available competitions.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="login-btn"]',
    popover: {
      title: "Login to Register",
      description: "Administrator login is required before registering participants.",
      side: "top",
      align: "center",
    },
  },
];

export const REGISTER_HOME_TOUR: DriveStep[] = [
  {
    element: '[data-tour="register-btn"]',
    popover: {
      title: "Register Now",
      description: "Tap here to begin registering a participant.",
      side: "top",
      align: "center",
    },
  },
];
