"use client";

import Link from "next/link";
import { ArrowLeft, Flower2 } from "lucide-react";
import { NOVENA } from "@/lib/novena-theme";

type Line =
  | { type: "carmi"; text: string }
  | { type: "samu"; text: string }
  | { type: "rubric"; text: string }
  | { type: "hymn"; lines: string[] };

type Section = { title: string; lines: Line[] };

const carmi = (text: string): Line => ({ type: "carmi", text });
const samu = (text: string): Line => ({ type: "samu", text });
const rubric = (text: string): Line => ({ type: "rubric", text });
const hymn = (lines: string[]): Line => ({ type: "hymn", lines });

const SECTIONS: Section[] = [
  {
    title: "പ്രാരംഭഗാനം",
    lines: [
      hymn([
        "കൊച്ചുത്രേസ്യായേ ധന്യേ",
        "പ്രാർത്ഥിക്ക ഞങ്ങൾക്കായി നീ",
        "സോദരർ ഞങ്ങൾക്കായി നീ",
        "പ്രാർത്ഥിക്ക സ്നേഹറാണീ (3 പ്രാവശ്യം)",
      ]),
    ],
  },
  {
    title: "ആമുഖ പ്രാർത്ഥന",
    lines: [
      carmi(
        "നിങ്ങൾ മാനസാന്തരപ്പെട്ട് ശിശുക്കളെപ്പോലെ ആകുന്നില്ലെങ്കിൽ സ്വർഗ്ഗരാജ്യത്തിൽ പ്രവേശിക്കുകയില്ലെന്ന് ഞങ്ങളെ പഠിപ്പിച്ച ഈശോയെ, കന്യകയും വേദപാരംഗതയുമായ വി. കൊച്ചുത്രേസ്യായുടെ ധന്യമായ ജീവിതത്തിലൂടെ ശിശുതുല്യമായ എളിമയുടെയും ദൈവസ്നേഹത്തിന്റെയും പരസ്നേഹത്തിന്റെയും മഹനീയ മാതൃക ഞങ്ങൾക്കു നല്കിയല്ലോ. ഈ വിശുദ്ധയെ അനുകരിച്ച് അങ്ങയോടുള്ള സ്നേഹത്താൽ പൂരിതരായി ജീവിക്കുവാനും സഹോദരങ്ങളുടെ ആത്മരക്ഷയ്ക്കായി യത്നിക്കുവാനും ഞങ്ങളെ അനുഗ്രഹിക്കണമേ. സകലത്തിന്റെയും നാഥാ, എന്നേക്കും,"
      ),
      samu("ആമ്മേൻ."),
      carmi(
        "സഹനത്തിന്റെ പാതയിലൂടെ നടന്ന് മിശിഹായുമായി താദാത്മ്യം പ്രാപിക്കുകയും, സ്വർഗ്ഗവാസം ഭൂമിയിൽ നന്മ ചെയ്യാൻ ചെലവഴിക്കുമെന്ന് വാഗ്ദാനം നല്കുകയും ചെയ്ത ലിസ്യൂവിലെ വി. കൊച്ചുത്രേസ്യായേ,"
      ),
      samu("അനുദിനജീവിതക്ലേശങ്ങളിലൂടെ വിശുദ്ധി പ്രാപിക്കാൻ ഞങ്ങളെ സഹായിക്കണമേ."),
      carmi(
        "ഈശോയുടെ വാത്സല്യഭാജനവും (സമൂഹവും ചേർന്ന്)/ വേദപാരംഗതയുമായ വി. കൊച്ചുത്രേസ്യായേ നിന്റെ മാതൃകയനുസരിച്ച്/ നിർമ്മലമായി ജീവിക്കുവാനും/ സ്വർഗ്ഗസ്ഥനായ പിതാവ് നല്കുന്ന/ സന്തോഷങ്ങളും ദുഃഖങ്ങളും നല്ല മനസ്സോടെ സ്വീകരിക്കാനും/ എന്റെ വിചാരങ്ങളും വചനങ്ങളും പ്രവൃത്തികളും/ ദൈവസ്തുതിക്കായി സമർപ്പിക്കാനും/ എന്നെ സഹായിക്കണമേ./ എന്റെ എല്ലാ പ്രാർത്ഥനകളിലും/ നിന്റെ സഹായം ഉണ്ടാകണമേ./ എന്റെ കുടുംബാംഗങ്ങളെയും സ്നേഹിതരെയും/ അയല്ക്കാരെയും കൈവിടല്ലേ./ വൈദികരെയും സന്യസ്തരെയും മിഷണറിമാരെയും/ അവരുടെ സമർപ്പണജീവിതത്തിന്റെ തീക്ഷ്ണതയിൽ സംരക്ഷിക്കണമേ./ ദൈവമേ, ഞാൻ നിന്നെ സ്നേഹിക്കുന്നു എന്നു പറഞ്ഞ്/ നീ ഭാഗ്യമരണം പ്രാപിച്ചപോലെ/ കർത്താവ് എന്നെ വിളിക്കാൻ തിരുമനസ്സാകുന്ന സമയത്ത്/ ദൈവസ്നേഹത്തിലും പ്രസാദവരത്തിലും/ ഇഹലോകവാസം വെടിഞ്ഞ്/ നിത്യസൗഭാഗ്യത്തിൽ പ്രവേശിക്കുവാൻ/ എന്നെ സഹായിക്കണമേ./ ആമ്മേൻ."
      ),
    ],
  },
  {
    title: "സങ്കീർത്തനം (27)",
    lines: [
      carmi("കർത്താവ് എന്റെ പ്രകാശവും രക്ഷയുമാകുന്നു/ ഞാൻ ആരെ ഭയപ്പെടണം."),
      samu("ഒരു സൈന്യം തന്നെ എനിക്കെതിരായി പാളയമടിച്ചാലും/ എന്റെ ഹൃദയം ഭയം അറിയുകയില്ല."),
      carmi("കർത്താവ് എന്റെ കോട്ടയാണ്/ ഞാൻ ആരെ പേടിക്കണം."),
      samu("എനിക്കെതിരായി യുദ്ധമുണ്ടായാലും/ ഞാൻ ആത്മധൈര്യം വെടിയുകയില്ല."),
      carmi("എന്നെ വലയം ചെയ്യുന്ന ശത്രുക്കളുടെ മുകളിൽ/ എന്റെ ശിരസ്സ് ഉയർന്നു നില്ക്കും"),
      samu("കർത്താവേ ഞാൻ ഉച്ചത്തിൽ വിളിച്ചപേക്ഷിക്കുമ്പോൾ/ കാരുണ്യപൂർവ്വം എനിക്കുത്തരമരുളണമേ."),
      carmi("അങ്ങയുടെ മുഖം എന്നിൽ നിന്നു മറച്ചുവയ്ക്കരുതേ/ അങ്ങയുടെ ദാസനെ കോപത്തോടെ തള്ളിക്കളയരുതേ."),
      samu("രക്ഷകനായ ദൈവമേ എന്നെ തിരസ്കരിക്കരുതേ/ അങ്ങയുടെ വഴി എനിക്കു കാണിച്ചു തരണമേ."),
      carmi("പിതാവിനും പുത്രനും പരിശുദ്ധാത്മാവിനും സ്തുതി"),
      samu("ആദിമുതൽ എന്നേക്കും, ആമ്മേൻ."),
    ],
  },
  {
    title: "കാറോസൂസ",
    lines: [
      carmi(
        "നമുക്കെല്ലാവർക്കും സന്തോഷത്തോടും ഉത്സാഹത്തോടും കൂടെ ദൈവകൃപയിൽ ആശ്രയിച്ചുകൊണ്ട് വി. കൊച്ചുത്രേസ്യായേ, ഈശോയോട് അപേക്ഷിക്കണമേ എന്ന് പ്രാർത്ഥിക്കാം."
      ),
      samu("വി. കൊച്ചുത്രേസ്യായേ, ഈശോയോട് അപേക്ഷിക്കണമേ"),
      carmi("അക്രമവും അനീതിയും യുദ്ധങ്ങളും അവസാനിപ്പിച്ച് ലോകരാഷ്ട്രങ്ങളെല്ലാം ശാന്തിയിലും സമാധാനത്തിലും ജീവിക്കുവാൻ,"),
      samu("വി. കൊച്ചുത്രേസ്യായേ, ഈശോയോട് അപേക്ഷിക്കണമേ"),
      carmi(
        "സാർവ്വത്രികസഭയുടെ തലവനായ പരിശുദ്ധ പിതാവ് മാർ ............ പാപ്പായ്ക്കും ഞങ്ങളുടെ സഭയുടെ പിതാവും തലവനുമായ മേജർ ആർച്ചുബിഷപ്പ് മാർ ............ മെത്രാപ്പോലീത്തായ്ക്കും ഞങ്ങളുടെ അതിരൂപതാദ്ധ്യക്ഷനായ മാർ ............ മെത്രാപ്പോലീത്തായ്ക്കും എല്ലാ വൈദികമേലദ്ധ്യക്ഷന്മാർക്കും ഭരമേല്പിക്കപ്പെട്ടിരിക്കുന്ന ഉത്തരവാദിത്വങ്ങൾ ദൈവഹിതാനുസരണം നിർവ്വഹിക്കപ്പെടുവാൻ,"
      ),
      samu("വി. കൊച്ചുത്രേസ്യായേ, ഈശോയോട് അപേക്ഷിക്കണമേ"),
      carmi(
        "ഞങ്ങളുടെ രൂപതയും ഞങ്ങളുടെ പിതാവും മേലദ്ധ്യക്ഷനുമായ മാർ ............ മെത്രാനും എല്ലാ വൈദികരും സമർപ്പിതരും അനുഗ്രഹിക്കപ്പെടുവാനും തീക്ഷ്ണതയുള്ള അത്മായപ്രേഷിതരെ ഞങ്ങൾക്കു ലഭിക്കുവാനും"
      ),
      samu("വി. കൊച്ചുത്രേസ്യായേ, ഈശോയോട് അപേക്ഷിക്കണമേ"),
      carmi("ഒരേ പിതാവിന്റെ മക്കളെപ്പോലെ ഈ ഇടവകാംഗങ്ങളെല്ലാവരും പരസ്പരം സ്നേഹിച്ചും സഹകരിച്ചും പ്രവർത്തിക്കുന്നതിന്"),
      samu("വി. കൊച്ചുത്രേസ്യായേ, ഈശോയോട് അപേക്ഷിക്കണമേ"),
      carmi(
        "ഞങ്ങളുടെ കുടുംബങ്ങളിൽ സമാധാനവും ശാന്തിയും പുലരുവാനും ഞങ്ങളുടെ കുഞ്ഞുങ്ങളും യുവജനങ്ങളും വിശുദ്ധിയിലും വിജ്ഞാനത്തിലും ദൈവത്തിന്റെയും മനുഷ്യരുടെയും പ്രീതിയിലും വളർന്നുവരുവാനും,"
      ),
      samu("വി. കൊച്ചുത്രേസ്യായേ, ഈശോയോട് അപേക്ഷിക്കണമേ"),
      rubric("(സന്ദർഭോചിതമായി മറ്റ് നിയോഗങ്ങളും കൂട്ടിച്ചേർക്കാവുന്നതാണ്)"),
      carmi("നിശ്ശബ്ദമായി നമ്മുടെ വ്യക്തിപരമായ പ്രാർത്ഥനകൾ വി. കൊച്ചുത്രേസ്യായുടെ മാദ്ധ്യസ്ഥം വഴി ദൈവതിരുസന്നിധിയിൽ സമർപ്പിക്കാം."),
      rubric("(നിശ്ശബ്ദം)"),
      carmi(
        "സ്നേഹപിതാവായ ദൈവമേ, അങ്ങേ പുത്രനോടുള്ള സ്നേഹത്താൽ എരിയുവാനും, ആത്മാക്കളുടെ രക്ഷയ്ക്കായി ജീവിതം സമർപ്പിക്കാനും ആഗ്രഹിച്ച വി. കൊച്ചുത്രേസ്യായെ അനുകരിച്ച് വിശുദ്ധിയിൽ വളരാൻ ഞങ്ങളേവരെയും അനുഗ്രഹിക്കണമേ. ഈ വിശുദ്ധയുടെ മാദ്ധ്യസ്ഥം വഴി ഞങ്ങൾ സമർപ്പിക്കുന്ന പ്രാർത്ഥനകൾ സ്വീകരിക്കണമേ. നിത്യം പിതാവും പുത്രനും പരിശുദ്ധാത്മാവുമായ സർവ്വേശ്വരാ, എന്നേക്കും,"
      ),
      samu("ആമ്മേൻ."),
    ],
  },
  {
    title: "ഗാനം",
    lines: [
      rubric("(ഈ സമയത്ത് കാർമ്മികൻ ജനങ്ങളുടെ മേൽ വിശുദ്ധജലം തളിക്കുന്നു)"),
      rubric("(നിത്യവിശുദ്ധയാം... എന്ന രീതി)"),
      hymn([
        "കർമ്മലാരാമത്തിൽ പൂത്തുവിരിഞ്ഞൊരു",
        "ഈശോ തൻ കൊച്ചുറാണീ",
        "നന്മവരങ്ങളാലുന്നതയാം ധന്യേ",
        "ഞങ്ങളിൽ പൂമഴ തൂകീടേണേ",
        "സ്വർഗ്ഗപിതാവിനെ സ്നേഹിച്ചു സ്നേഹിച്ചു",
        "നെയ്ത്തിരി പോലെയെരിഞ്ഞ കന്യേ (2)",
        "ഞങ്ങളുമീലോക ജീവിതയാത്രയിൽ",
        "നിൻപാത നിത്യം ചരിച്ചീടട്ടേ",
        "നിൻപാത നിത്യം ചരിച്ചീടട്ടേ",
        "ആത്മീയ ശൈശവ ജീവിതപാതയിൽ",
        "പൂർണയായിത്തീർന്നൊരു കന്യകയേ (2)",
        "ഞങ്ങളുമാവഴി പൂർണരായിത്തീരുവാൻ",
        "സർവേശാനുഗ്രഹമേകൂ- ഞങ്ങളിൽ",
        "സർവേശാനുഗ്രഹമേകൂ.",
      ]),
    ],
  },
  {
    title: "സമാപന പ്രാർത്ഥന",
    lines: [
      carmi(
        "\"നിങ്ങൾ ശിശുക്കളെപ്പോലെയാകുന്നില്ലെങ്കിൽ (സമൂഹവും ചേർന്ന്)/ സ്വർഗ്ഗരാജ്യത്തിൽ പ്രവേശിക്കുകയില്ല\"/ എന്ന് അരുൾച്ചെയ്തുകൊണ്ട്/ ഞങ്ങളിൽ നിന്ന് സ്നേഹവും നിർമ്മലതയും പ്രതീക്ഷിക്കുന്ന മിശിഹായേ/ അങ്ങേ വത്സലപുത്രിയായ വിശുദ്ധ കൊച്ചുത്രേസ്യായുടെ മാദ്ധ്യസ്ഥത്താൽ/ ഞങ്ങൾക്കു സുകൃതങ്ങളിൽ അഭിവൃദ്ധിയും/ ക്ലേശങ്ങളിൽ സഹനശക്തിയും പ്രദാനം ചെയ്യണമേ./ സുവിശേഷപ്രവർത്തനങ്ങളുടെ മദ്ധ്യസ്ഥയായ വിശുദ്ധയുടെ മാതൃകയനുസരിച്ച്/ പാപികളുടെ മാനസാന്തരത്തിനായി നിരന്തരം യത്നിക്കുവാനും/ സഭയുടെ പ്രേഷിതപ്രവർത്തനങ്ങളിൽ സജീവമായി സഹകരിക്കുവാനുമുള്ള/ സന്നദ്ധതയും സന്മനസ്സും ഞങ്ങൾക്കു നല്കുകയും ചെയ്യണമേ, ആമ്മേൻ"
      ),
      carmi("ഈശോമിശിഹായുടെ വാഗ്ദാനങ്ങൾക്ക് ഞങ്ങൾ യോഗ്യരാകുവാൻ"),
      samu("വി. കൊച്ചുത്രേസ്യായേ, ഞങ്ങൾക്കുവേണ്ടി അപേക്ഷിക്കണമേ."),
      carmi(
        "അത്ഭുതകരങ്ങളായ വരങ്ങളാലും സ്വർഗ്ഗീയദാനങ്ങളാലും വി. കൊച്ചുത്രേസ്യായെ അലങ്കരിക്കാൻ തിരുമനസ്സായ ദൈവമേ, ഈ വിശുദ്ധയെപ്പോലെ അങ്ങയെ സ്നേഹിക്കുവാനും പുണ്യജീവിതത്തിൽ വളരാനും ആത്മാർത്ഥമായ ആഗ്രഹവും സ്ഥിരമായ പരിശ്രമവും ഞങ്ങൾക്കു നല്കണമേ. ശിശുസഹജമായ നിഷ്കളങ്കതയിലും ഹൃദയനൈർമ്മല്യത്തിലും സദാ വ്യാപരിക്കുവാൻ ഞങ്ങളെ സഹായിക്കണമേ. അങ്ങയിൽ നിരന്തരം ആശ്രയിക്കുവാനും അങ്ങേക്കു സമ്പൂർണ്ണമായി സമർപ്പിക്കുവാനും ഞങ്ങളെ ശക്തരാക്കണമേ. സഹനങ്ങളുടെ ഇടയിലും മരണവിനാഴികയിലും സ്നേഹഗീതമാലപിച്ച് അങ്ങയെ പുല്കിയ വിശുദ്ധ കൊച്ചുത്രേസ്യായെ അനുകരിച്ച് അനുദിനക്ലേശങ്ങളിൽ അവിടുത്തെ പരിപാലന ദർശിക്കുവാൻ ഞങ്ങൾക്കു വരം തരണമേ. പിതാവും പുത്രനും പരിശുദ്ധാത്മാവുമായ ത്രിയേകദൈവത്തിന്റെ അനുഗ്രഹം നിങ്ങളിൽ വന്നു നിറയുകയും നിത്യം നിലനില്ക്കുകയും ചെയ്യട്ടെ, ഇപ്പോഴും + എപ്പോഴും + എന്നേക്കും +"
      ),
      samu("ആമ്മേൻ."),
    ],
  },
  {
    title: "സമാപനഗാനം",
    lines: [
      rubric("(ഭാരതം കതിരു കണ്ടു... എന്ന രീതി)"),
      hymn([
        "ധന്യയാം കൊച്ചുത്രേസ്യായേ",
        "ഈശോതൻ സ്നേഹറാണീ",
        "സ്വർഗ്ഗത്തിൽ നിന്നു നീ",
        "ഞങ്ങൾക്കായെന്നെന്നും",
        "മദ്ധ്യസ്ഥയായിടണേ.",
        "സ്നേഹം സ്നേഹത്താൽ വീട്ടപ്പെടുന്നൊരു",
        "ആത്മീയ ശൈശവ മാർഗം",
        "സ്വർഗ്ഗത്തിലെത്തുവാൻ",
        "ഈശോയെ കാണുവാൻ",
        "ഞങ്ങൾക്കായ് എന്നും നീ നല്കി",
        "ദൈവവിളിക്കു നീ ഉത്തരം നല്കി",
        "പാപികൾക്കായെന്നും നീ പ്രാർത്ഥിച്ചു",
        "പ്രാർത്ഥന, ത്യാഗവും",
        "സഹനങ്ങളെല്ലാം നീ",
        "ക്രൂശിതനാഥനിൽ ചേർത്തുവച്ചു.",
      ]),
    ],
  },
];

function DialogueBlock({ speaker, text }: { speaker: "കാർമ്മി" | "സമൂ"; text: string }) {
  const parts = text.split("/").map((s) => s.trim()).filter(Boolean);
  const isCarmi = speaker === "കാർമ്മി";
  return (
    <div
      className="mb-2.5 last:mb-0 p-2.5 rounded-[14px]"
      style={{
        background: isCarmi ? "rgba(219,39,119,0.09)" : "rgba(245,197,66,0.16)",
        borderLeft: `3px solid ${isCarmi ? NOVENA.headingDark : NOVENA.gold}`,
      }}
    >
      <span
        className="inline-block mb-1.5 px-2 py-[2px] rounded-full text-[10.5px] font-bold"
        style={{
          fontFamily: "var(--font-poppins), sans-serif",
          color: isCarmi ? "#fff" : "#7A5C00",
          background: isCarmi ? NOVENA.headingDark : "rgba(245,197,66,0.4)",
        }}
      >
        {speaker}
      </span>
      <p className="text-[17.5px] font-bold leading-[1.8] m-0" style={{ color: NOVENA.text }}>
        {parts.map((p, i) => (
          <span key={i}>
            {p}
            {i < parts.length - 1 && <br />}
          </span>
        ))}
      </p>
    </div>
  );
}

function SectionCard({ section }: { section: Section }) {
  return (
    <div
      className="rounded-[20px] p-4 mb-3.5"
      style={{ background: NOVENA.card, border: `1px solid ${NOVENA.cardLine}`, backdropFilter: "blur(12px)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Flower2 size={15} color={NOVENA.headingDark} />
        <h2
          className="font-extrabold text-[17px] tracking-tight m-0"
          style={{ fontFamily: "var(--font-anek), sans-serif", color: NOVENA.headingDark }}
        >
          {section.title}
        </h2>
      </div>
      {section.lines.map((line, i) => {
        if (line.type === "carmi") return <DialogueBlock key={i} speaker="കാർമ്മി" text={line.text} />;
        if (line.type === "samu") return <DialogueBlock key={i} speaker="സമൂ" text={line.text} />;
        if (line.type === "rubric")
          return (
            <p key={i} className="text-[13px] italic text-center my-2.5" style={{ color: NOVENA.faint }}>
              {line.text}
            </p>
          );
        // hymn
        return (
          <div key={i} className="text-center py-1.5 px-2">
            {line.lines.map((l, j) => (
              <p
                key={j}
                className="text-[16px] font-bold italic leading-[1.75] m-0"
                style={{ color: NOVENA.text, fontFamily: "var(--font-anek), sans-serif" }}
              >
                {l}
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function StTheresaNovena() {
  return (
    <div
      className="relative min-h-dvh w-full max-w-md mx-auto overflow-hidden"
      style={{ background: `linear-gradient(180deg, ${NOVENA.page} 0%, ${NOVENA.bg} 40%, ${NOVENA.bg2} 100%)` }}
    >
      {/* soft rose glow blobs */}
      <div className="absolute -top-10 -right-16 w-[220px] h-[220px] rounded-full pointer-events-none" style={{ background: NOVENA.glow, filter: "blur(50px)" }} />
      <div className="absolute top-[280px] -left-20 w-[200px] h-[200px] rounded-full pointer-events-none" style={{ background: "rgba(245,197,66,0.18)", filter: "blur(50px)" }} />

      <div className="relative px-5 pt-5 pb-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <Link
            href="/"
            className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            style={{ background: "rgba(255,255,255,0.6)", border: `1px solid ${NOVENA.line}` }}
          >
            <ArrowLeft size={19} color={NOVENA.accent} />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[15px] tracking-tight" style={{ fontFamily: "var(--font-poppins), sans-serif", color: NOVENA.text }}>
              നൊവേന പ്രാർത്ഥന
            </div>
            <div className="text-[11px] font-medium" style={{ color: NOVENA.faint }}>CML Kalpetta &middot; St. Little Thérèse</div>
          </div>
        </div>

        {/* Title block */}
        <div className="mb-5 flex items-start gap-3.5">
          <div className="flex-1 min-w-0">
            <div
              className="inline-flex items-center gap-1.5 font-bold text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full mb-2.5"
              style={{ fontFamily: "var(--font-poppins), sans-serif", color: "#fff", background: `linear-gradient(135deg, ${NOVENA.accent}, ${NOVENA.accent2})` }}
            >
              തിരുനാൾ ദിനം &middot; ഒക്ടോബർ 1
            </div>
            <h1
              className="font-bold text-[26px] m-0 tracking-tight leading-[1.15]"
              style={{ fontFamily: "var(--font-anek), sans-serif", color: NOVENA.text }}
            >
              വിശുദ്ധ കൊച്ചുത്രേസ്യായുടെ
              <br />
              <span style={{ background: `linear-gradient(100deg, ${NOVENA.accent}, ${NOVENA.accent2})`, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                നൊവേന
              </span>
            </h1>
            <p className="text-[14.5px] font-medium mt-2.5 leading-relaxed" style={{ color: NOVENA.sub }}>
              ലിസ്യൂവിലെ വി. കൊച്ചുത്രേസ്യായോടുള്ള (ഈശോയുടെ പൈതൽ) നൊവേന പ്രാർത്ഥന.
            </p>
          </div>
          <div
            className="shrink-0 rounded-[20px] overflow-hidden"
            style={{ width: 96, height: 128, border: `2px solid rgba(255,255,255,0.7)`, boxShadow: `0 10px 24px ${NOVENA.glow}` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/novena/st-theresa-hero.jpg"
              alt="St. Thérèse of Lisieux"
              className="w-full h-full"
              style={{ objectFit: "cover", objectPosition: "50% 10%" }}
            />
          </div>
        </div>

        {SECTIONS.map((section) => (
          <SectionCard key={section.title} section={section} />
        ))}

        <p className="text-center text-[11px] mt-2" style={{ color: NOVENA.faint }}>
          സ്രോതസ്സ്: നൊവേന പ്രാർത്ഥനാപുസ്തകം
        </p>
      </div>
    </div>
  );
}
