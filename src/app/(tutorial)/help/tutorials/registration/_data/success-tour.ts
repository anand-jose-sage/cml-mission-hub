import type { DriveStep } from "driver.js";

export const SUCCESS_TOUR: DriveStep[] = [
  {
    element: '[data-tour="success-hero"]',
    popover: {
      title: "Registration complete",
      description: "പങ്കെടുക്കുന്നയാളെ ചേർത്തിട്ടുണ്ട്. ഒരു Confirmation കാർഡ് ഇവിടെ ദൃശ്യമാകുന്നു.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: '[data-tour="reg-no"]',
    popover: {
      title: "Registration number",
      description: "ഓരോ രജിസ്ട്രേഷനും ഒരു നമ്പർ ലഭിക്കുന്നു. ഇത് പങ്കെടുക്കുന്നവർക്ക്  പങ്കുവെക്കുക, വേദിയിൽ റഫറൻസ് ആയി ഉപയോഗിക്കാൻ.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: '[data-tour="success-summary"]',
    popover: {
      title: "Saved details",
      description: "എല്ലാ നൽകിയ വിവരങ്ങളും രജിസ്ട്രേഷനുമായി ചേർത്ത് സേവ് ചെയ്യുന്നു. Participants സ്ക്രീനിൽ നിന്ന് പേര് അല്ലെങ്കിൽ രജിസ്ട്രേഷൻ നമ്പർ ഉപയോഗിച്ച് തിരയാം.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="next-button"]',
    popover: {
      title: "All done",
      description: "Finish ടാപ്പ് ചെയ്ത് Mission Hub ലേക്ക് മടങ്ങുക. ഇതാണ് മുഴുവൻ രജിസ്ട്രേഷൻ പ്രക്രിയ.",
      side: "top",
      align: "end",
    },
  },
];
