import type { DriveStep } from "driver.js";

export const REVIEW_TOUR: DriveStep[] = [
  {
    element: '[data-tour="review-summary"]',
    popover: {
      title: "Confirm the details",
      description: "ഇതുവരെ നൽകിയതെല്ലാം ഇവിടെ പട്ടികപ്പെടുത്തിയിട്ടുണ്ട്. സേവ് ചെയ്യുന്നതിനുമുമ്പ് തെറ്റുകൾ കണ്ടെത്താനുള്ള നിങ്ങളുടെ അവസാന അവസരമാണിത്.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="review-category"]',
    popover: {
      title: "Category & shakha",
      description: "വിഭാഗം ജനന തിയ്യതി അടിസ്ഥാനമാക്കി നിർണയിക്കുന്നു, ശാഖ നിങ്ങളുടെ അഡ്മിൻ ശാഖയാണ് —  സ്വയം പൂരിപ്പിക്കപ്പെടുന്നു.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="review-comps"]',
    popover: {
      title: "Selected competitions",
      description: "പങ്കെടുക്കുന്ന എല്ലാ മത്സരങ്ങളും ഇവിടെ കാണിക്കുന്നു. ഏതെങ്കിലും മാറ്റം ചെയ്യാൻ, Back ടാപ്പ് ചെയ്ത് step 2 ലേക്ക് പോകുക.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="next-button"]',
    popover: {
      title: "Confirm registration",
      description: "Next ടാപ്പ് ചെയ്ത് രജിസ്ട്രേഷൻ സേവ് ചെയ്യുക. ഒരു  രജിസ്ട്രേഷൻ നമ്പർ ലഭിക്കും.",
      side: "top",
      align: "end",
    },
  },
];
