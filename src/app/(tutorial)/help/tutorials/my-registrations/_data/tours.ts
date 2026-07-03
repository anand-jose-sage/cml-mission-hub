import type { DriveStep } from "driver.js";

export const DETAILS_TOUR: DriveStep[] = [
  {
    element: '[data-tour="my-registrations-btn"]',
    popover: {
      title: "My Registrations",
      description: "ഇതിനകം ശാഖയിൽ നിന്നും രജിസ്റ്റർ ചെയ്ത എല്ലാ മത്സരാർത്ഥികളെയും കാണുക..",
      side: "top",
      align: "center",
    },
  },
];

export const REGISTRATIONS_TOUR: DriveStep[] = [
  {
    element: '[data-tour="registrations-summary"]',
    popover: {
      title: "Summary Card",
      description: "ഈ കാർഡ് നിങ്ങളുടെ ശാഖയും രജിസ്ട്രേഷനുകളുടെ മൊത്തം സംഖ്യയും കാണിക്കുന്നു.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="download-registrations-btn"]',
    disableActiveInteraction: true,
    popover: {
      title: "Download Button",
      description: "PDF ആയി പൂര്‍ണ രജിസ്ട്രേഷന്‍ റിപ്പോര്‍ട്ട് ഡൗണ്‍ലോഡ് ചെയ്യുക.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: '[data-tour="registration-category-card"]',
    popover: {
      title: "Registration Category",
      description: "രജിസ്ട്രേഷനുകൾ മത്സരം, വിഭാഗം എന്നിവയുടെ അടിസ്ഥാനത്തിൽ ഗ്രൂപ്പുചെയ്യപ്പെട്ടിരിക്കുന്നു. ഓരോ കാർഡും രജിസ്റ്റർ ചെയ്ത മത്സരാർത്ഥികളുടെ എണ്ണം കാണിക്കുന്നു.",
      side: "bottom",
      align: "start"
    },
  },
  {
    element: '[data-tour="registration-category-expand"]',
    popover: {
      title: "Expand Category",
      description: "ടാപ്പ് ചെയ്ത് രജിസ്റ്റർ ചെയ്ത എല്ലാ മത്സരാർത്ഥികളെയും കാണുക.",
      side: "left",
      align: "center",
    },
    onHighlightStarted: () => {
      (document.querySelector('[data-tour="registration-category-card"] button') as HTMLElement | null)?.click();
    },
  },
  {
    element: '[data-tour="registration-participant-list"]',
    popover: {
      title: "Participant List",
      description: "ഇവിടെ ഓരോ മത്സരാർത്ഥിയുടെയും പേര്, ഹൗസ്, രജിസ്ട്രേഷൻ നമ്പർ എന്നിവ പരിശോധിക്കുക. പൂർണ്ണ വിവരങ്ങൾ , മത്സരം എന്നിവ ഉൾപ്പെടെ — PDF എക്സ്പോർട്ട് ചെയ്യുമ്പോൾ ഉൾപ്പെടുന്നു.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="download-registrations-btn"]',
    disableActiveInteraction: true,
    popover: {
      title: "Download PDF",
      description: "രജിസ്ട്രേഷൻ ലിസ്റ്റ് ഡൗൺലോഡ് ചെയ്യുക അല്ലെങ്കിൽ പ്രിന്റ് ചെയ്യുക",
      side: "bottom",
      align: "end",
    },
  },
  {
    popover: {
      title: "Tutorial Complete",
      description: "Yനിങ്ങൾ ഇപ്പോൾ മനസ്സിലാക്കിയിരിക്കുന്നു<br/>✓ നിലവിലുള്ള രജിസ്‌ട്രേഷനുകൾ കാണുവാനും<br/>✓ രജിസ്ട്രേഷൻ വിഭാഗങ്ങൾ മനസ്സിലാക്കാനും ചെയ്യാനും<br/>✓ മത്സരാർത്ഥികളുടെ പട്ടിക പരിശോധിക്കാനും<br/>✓ ഔദ്യോഗിക രജിസ്ട്രേഷൻ റിപ്പോർട്ട് ഡൗൺലോഡ് ചെയ്യാനും",
    },
  },
];
