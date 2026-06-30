import type { DriveStep } from "driver.js";

export const COMPETITIONS_TOUR: DriveStep[] = [
  {
    element: '[data-tour="comp-first"]',
    popover: {
      title: "Competition cards",
      description: "ഓരോ കാർഡും പങ്കെടുക്കുന്നയാൾക്ക് യോഗ്യതയുള്ള ഒരു മത്സര ഇനമാണ് . ഒരു മത്സരം  തിരഞ്ഞെടുക്കാനോ തിരഞ്ഞെടുത്തത് മാറ്റാനോ അതിൽ ടാപ്പ് ചെയ്യുക.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="comp-gendered"]',
    popover: {
      title: "Gender & category badges",
      description: "ചില മത്സരങ്ങൾ ആൺകുട്ടികൾക്കും പെൺകുട്ടികൾക്കും പ്രത്യേക പ്രായ വിഭാഗങ്ങൾക്കും മാത്രമായി പരിമിതപ്പെടുത്തിയിരിക്കുന്നു.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="selected-count"]',
    popover: {
      title: "Selected count",
      description: "നിങ്ങൾ മത്സരങ്ങൾ തിരഞ്ഞെടുക്കുമ്പോൾ ഈ കൗണ്ടർ അപ്ഡേറ്റ് ചെയ്യുന്നു. പരമാവധി പരിധി 2 ആണ്.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="next-button"]',
    popover: {
      title: "Continue to review",
      description: "നിങ്ങൾ മത്സരങ്ങൾ തിരഞ്ഞെടുക്കുമ്പോൾ, രജിസ്ട്രേഷൻ പരിശോധിക്കാൻ Next ടാപ്പ് ചെയ്യുക.",
      side: "top",
      align: "end",
    },
  },
];
