import type { DriveStep } from "driver.js";

export const DETAILS_TOUR: DriveStep[] = [
  {
    element: '[data-tour="name"]',
    popover: {
      title: "Participant name",
      description: "Enter the participant's full name  പങ്കെടുക്കുന്നയാളുടെ മുഴുവൻ പേര് നൽകുക.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="house-name"]',
    popover: {
      title: "House name",
      description: "Optional. The House name helps distinguish participants who share a first name പങ്കെടുക്കുന്നയാളുടെ  വീട്ടു പേര് നൽകുക",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="dob"]',
    popover: {
      title: "Date of birth",
      description: "പങ്കെടുക്കുന്നയാളെ ശരിയായ പ്രായ വിഭാഗത്തിൽ ഉൾപ്പെടുത്താൻ ഉപയോഗിക്കുന്നു.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="category"]',
    popover: {
      title: "Competition category",
      description: "ജനന തിയ്യതി അടിസ്ഥാനമാക്കി നിർണയിക്കുന്നു. ഇത് മത്സരാർത്ഥി ഏത് ഇവന്റുകളിൽ പങ്കെടുക്കാൻ യോഗ്യനാണ് എന്ന് തീരുമാനിക്കുന്നു.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="gender"]',
    popover: {
      title: "Gender",
      description: "ആൺകുട്ടികൾ / പെൺകുട്ടികൾ എന്നിങ്ങനെ തിരിച്ചിരിക്കുന്ന മത്സരങ്ങൾക്ക് ആവശ്യമാണ്",
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
      description: "നിങ്ങളുടെ ശാഖയ്ക്ക് കീഴിൽ രജിസ്ട്രേഷനുകൾ Automatically ഫയൽ ചെയ്യപ്പെടുന്നു - ഒരെണ്ണം തിരഞ്ഞെടുക്കേണ്ടതില്ല.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="next-button"]',
    popover: {
      title: "Continue",
      description: "വിവരങ്ങൾ ശരിയാണെന്ന് ഉറപ്പായാൽ, അടുത്തത് തിരഞ്ഞെടുക്കാൻ Next ടാപ്പ് ചെയ്യുക.",
      side: "top",
      align: "end",
    },
  },
];
