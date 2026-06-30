import type { DriveStep } from "driver.js";

export const HOME_TOUR: DriveStep[] = [
  {
    element: '[data-tour="feast-portal-card"]',
    popover: {
      title: "Feast Portal",
      description: "മേഖല  മത്സര  രജിസ്ട്രേഷനുകളും ഫലങ്ങളും റാങ്കിംഗുകളും കൈകാര്യം ചെയ്യുന്ന മത്സര  പോർട്ടലാണിത്..",
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
      description: "ഈ പേജിൽ  എല്ലാ മത്സരങ്ങളും പട്ടികപ്പെടുത്തിയിരിക്കുന്നു..",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="feast-listing-first-view-btn"]',
    popover: {
      title: "View Details",
      description: "ഈ മത്സരം തുറന്ന് വിശദാംശങ്ങൾ കാണുകയും രജിസ്ട്രേഷൻ ആരംഭിക്കുകയും ചെയ്യുക.",
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
      description: "ഈ പേജിൽ മത്സര വിവരങ്ങൾ, വേദി, തീയതി, ലഭ്യമായ മത്സരങ്ങൾ എന്നിവ കാണിച്ചിരിക്കുന്നു.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="login-btn"]',
    popover: {
      title: "Login to Register",
      description: "പങ്കെടുക്കുന്നവരെ രജിസ്റ്റർ ചെയ്യുന്നതിന് മുൻപ് അഡ്മിനിസ്ട്രേറ്റർ ലോഗിൻ ആവശ്യമാണ്.",
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
      description: "പങ്കെടുക്കുന്നവരെ രജിസ്റ്റർ ചെയ്യാൻ ഇവിടെ ടാപ്പ് ചെയ്യുക.",
      side: "top",
      align: "center",
    },
  },
];
