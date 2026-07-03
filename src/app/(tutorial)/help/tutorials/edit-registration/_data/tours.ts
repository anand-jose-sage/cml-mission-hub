import type { DriveStep } from "driver.js";

export const PICK_TOUR: DriveStep[] = [
  {
    element: '[data-tour="edit-existing-registration-card"]',
    popover: {
      title: "Existing Registration",
      description: "നിങ്ങൾ ഈ മത്സരത്തിനായി ഇതിനകം രജിസ്റ്റർ ചെയ്തിട്ടുണ്ട്.",
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
      title: "Existing Registration",
      description: "എഡിറ്റ് ഐക്കൺ ടാപ്പ് ചെയ്ത് നിങ്ങളുടെ രജിസ്ട്രേഷൻ വിശദാംശങ്ങൾ അപ്ഡേറ്റ് ചെയ്യുക.",
      side: "left",
      align: "center",
      showButtons: ["previous", "close"],
    },
  },
];

export const FORM_GUIDING_TOUR: DriveStep[] = [
  {
    element: '[data-tour="edit-registration-form"]',
    popover: {
      title: "Update Your Details",
      description: "നിങ്ങളുടെ രജിസ്ട്രേഷൻ വിശദാംശങ്ങൾ പരിശോധിക്കുക. തുടരുന്നതിന് മുമ്പ് നിങ്ങളുടെ വ്യക്തിഗത വിവരങ്ങൾ എഡിറ്റ് ചെയ്യാം.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="edit-registration-form"]',
    popover: {
      title: "Edit Information",
      description: "തിരുത്തലുകൾ ആവശ്യമുള്ള വിവരങ്ങൾ പുതുക്കുക. നിങ്ങളുടെ ജനനത്തീയതിയെ അടിസ്ഥാനമാക്കി മത്സര വിഭാഗം സ്വയം കണക്കാക്കപ്പെടുന്നു.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="edit-category-badge"]',
    popover: {
      title: "Competition Category",
      description: "നിങ്ങളുടെ ജനനത്തീയതിയെ അടിസ്ഥാനമാക്കി നിങ്ങളുടെ വിഭാഗം സ്വയം നിശ്ചയിക്കപ്പെടുന്നു, ഇത് മാനുവൽ ആയി എഡിറ്റ് ചെയ്യാൻ കഴിയില്ല.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="edit-continue-btn"]',
    popover: {
      title: "Save Changes",
      description: "തുടരാൻ Continue ടാപ്പ് ചെയ്യുക, തുടർന്ന് നിങ്ങളുടെ മത്സരങ്ങൾ പരിശോധിച്ച് Save Changes ടാപ്പ് ചെയ്ത് നിങ്ങളുടെ രജിസ്ട്രേഷൻ അപ്ഡേറ്റ് ചെയ്യുക.",
      side: "top",
      align: "center",
      showButtons: ["previous", "close"],
    },
  },
];

export const DONE_TOUR: DriveStep[] = [
  {
    popover: {
      title: "Registration Updated",
      description: "നിങ്ങളുടെ രജിസ്ട്രേഷൻ വിശദാംശങ്ങൾ വിജയകരമായി അപ്ഡേറ്റ് ചെയ്തു.",
    },
  },
];
