import type { DriveStep } from "driver.js";

export const PICK_TOUR: DriveStep[] = [
  {
    element: '[data-tour="edit-existing-registration-card"]',
    popover: {
      title: "Open a Registration",
      description: "നിലവിലുള്ള ഒരു രജിസ്ട്രേഷൻ നമുക്ക് തുറന്നുനോക്കാം; അത് എങ്ങനെ നീക്കം ചെയ്യാമെന്ന് നിങ്ങൾക്ക് അതിലൂടെ മനസ്സിലാക്കാം.",
      side: "bottom",
      align: "start",
    },
    onHighlightStarted: () => {
      (document.querySelector('[data-tour="edit-existing-registration-card"]') as HTMLElement | null)?.click();
    },
  },
  {
    element: '[data-tour="edit-existing-registration-edit-btn"]',
    popover: {
      title: "Open a Registration",
      description: "എഡിറ്റ് ഐക്കൺ ടാപ്പ് ചെയ്ത് ഈ രജിസ്ട്രേഷൻ തുറക്കുക.",
      side: "left",
      align: "center",
      showButtons: ["previous", "close"],
    },
  },
];

export const FORM_TOUR: DriveStep[] = [
  {
    element: '[data-tour="edit-delete-btn"]',
    popover: {
      title: "Remove Registration",
      description: "ഇനി പങ്കെടുക്കാൻ ആഗ്രഹിക്കുന്നില്ലെങ്കിൽ, നിങ്ങൾക്ക് ഈ രജിസ്ട്രേഷൻ ശാശ്വതമായി നീക്കം ചെയ്യാവുന്നതാണ്",
      side: "top",
      align: "center",
      showButtons: ["previous", "close"],
    },
  },
];

export const CONFIRM_TOUR: DriveStep[] = [
  {
    element: '[data-tour="edit-delete-confirm"]',
    popover: {
      title: "Confirm Deletion",
      description: "ഈ നടപടി നിങ്ങളുടെ രജിസ്ട്രേഷൻ ശാശ്വതമായി നീക്കം ചെയ്യുന്നു. ഇത് പിന്നീട് മാറ്റാനാവില്ല..",
      side: "top",
      align: "center",
    },
  },
  {
    element: '[data-tour="edit-delete-yes-btn"]',
    popover: {
      title: "Delete Registration",
      description: "നിങ്ങൾ ഈ രജിസ്ട്രേഷൻ ശാശ്വതമായി നീക്കം ചെയ്യാൻ ഉറപ്പുള്ളതാണെങ്കിൽ മാത്രമേ ഇവിടെ ടാപ്പ് ചെയ്യൂക.",
      side: "top",
      align: "center",
      showButtons: ["previous", "close"],
    },
  },
];

export const DONE_TOUR: DriveStep[] = [
  {
    element: '[data-tour="registration-category-card"]',
    popover: {
      title: "Registration Removed",
      description: "നിങ്ങളുടെ രജിസ്ട്രേഷൻ വിജയകരമായി നീക്കം ചെയ്തു. രജിസ്ട്രേഷൻ തുറന്നിരിക്കുന്ന സമയത്ത് നിങ്ങൾക്ക് വീണ്ടും രജിസ്റ്റർ ചെയ്യാം.",
      side: "bottom",
      align: "start",
    },
  },
];
