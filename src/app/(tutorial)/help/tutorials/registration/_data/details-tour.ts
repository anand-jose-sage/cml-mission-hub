import type { DriveStep } from "driver.js";

export const DETAILS_TOUR: DriveStep[] = [
  {
    element: '[data-tour="name"]',
    popover: {
      title: "Participant name",
      description: "Enter the participant's full name as it should appear on the registration.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="house-name"]',
    popover: {
      title: "House name",
      description: "Optional. The family or house name helps distinguish participants who share a first name.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="dob"]',
    popover: {
      title: "Date of birth",
      description: "Used to automatically place the participant in the correct age category.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="category"]',
    popover: {
      title: "Competition category",
      description: "Derived from the date of birth. This decides which events the participant is eligible for.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="gender"]',
    popover: {
      title: "Gender",
      description: "Required for competitions that are split into Boys / Girls categories.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="phone"]',
    popover: {
      title: "Phone number",
      description: "Optional. Add a contact number if the participant or a guardian can be reached during the feast.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="shakha"]',
    popover: {
      title: "Your shakha",
      description: "Registrations are filed under your admin shakha automatically — no need to pick one.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="next-button"]',
    popover: {
      title: "Continue",
      description: "Once the details look right, tap Next to choose competitions.",
      side: "top",
      align: "end",
    },
  },
];
