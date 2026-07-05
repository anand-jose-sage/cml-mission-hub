"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";
import { COLORS, type CMLTheme } from "@/lib/theme";

function MemberRow({ role, name }: { role: string; name: string }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
      style={{
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.5)",
      }}
    >
      <span
        className="text-[11.5px] font-semibold uppercase tracking-wide shrink-0 w-[100px]"
        style={{ color: COLORS.purple }}
      >
        {role}
      </span>
      <span
        className="text-[13.5px] font-medium flex-1"
        style={{ color: COLORS.text }}
      >
        {name}
      </span>
    </div>
  );
}

interface AboutScreenProps {
  theme: CMLTheme;
}

export function AboutScreen({ theme }: AboutScreenProps) {
  return (
    <div className="h-full overflow-y-auto scrollbar-hide pb-28">
      <div className="flex flex-col items-center text-center pt-14 px-6">
        {/* Logo */}
        <div
          className="w-[100px] h-[100px] rounded-full overflow-hidden mb-5"
          style={{
            boxShadow:
              "0 12px 36px rgba(107,70,255,0.2), 0 4px 14px rgba(30,27,75,0.1)",
          }}
        >
          <Image
            src="/logo.png"
            alt="CML Logo"
            width={100}
            height={100}
            className="object-cover w-full h-full"
            priority
          />
        </div>

        {/* Title */}
        <h1
          className="font-[family-name:var(--font-poppins)] font-bold text-[22px] leading-tight tracking-tight mb-1"
          style={{ color: COLORS.text }}
        >
          Cherupushpa Mission League
        </h1>

        {/* Location */}
        <div className="inline-flex items-center gap-1 mb-5">
          <MapPin size={13} color={COLORS.purple} />
          <span
            className="text-[14.5px] font-medium"
            style={{ color: COLORS.sub }}
          >
            Kalpetta Meghala
          </span>
        </div>

        {/* Divider */}
        <div
          className="w-12 h-[3px] rounded-full mb-6"
          style={{
            background:
              "linear-gradient(90deg, rgba(107,70,255,0.3), rgba(167,139,250,0.3))",
          }}
        />

        {/* Tagline */}
        <p
          className="text-[16px] leading-relaxed font-medium italic max-w-[280px] mb-8"
          style={{ color: COLORS.sub }}
        >
          A mission initiative for new Age
        </p>

        {/* Executive Members */}
        <div className="w-full text-left">
          <h3
            className="font-[family-name:var(--font-poppins)] font-semibold text-[15px] tracking-tight mb-3 text-center"
            style={{ color: COLORS.text }}
          >
            Executive Members
          </h3>

          <div className="flex flex-col gap-2">
            <MemberRow role="Director" name="Rev Fr Jerin Poykayil" />
            <MemberRow role="Joint Director" name="Sr Melvia Ambaril SH" />
            <MemberRow role="President" name="Tony K T" />
            <MemberRow role="Vice President" name="Rincy" />
            <MemberRow role="Secretary" name="Anand Jose" />
            <MemberRow role="Joint Secretary" name="Smt Betty" />
            <MemberRow role="Organizer" name="Sudeesh Edathumparambi" />
            <MemberRow role="Organizer" name="Smt Rari" />
            <MemberRow role="Organizer" name="Robin Arackal" />
            <MemberRow role="Roopatha Exe" name="Jhon Pullapillil" />
            <MemberRow role="Roopatha Exe" name="Vineetha Maria" />
          </div>
        </div>
      </div>
    </div>
  );
}
