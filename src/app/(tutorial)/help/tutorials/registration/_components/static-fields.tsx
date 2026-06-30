"use client";

import { User, Phone, Calendar } from "lucide-react";
import { CATEGORY_LABELS, CATEGORY_COLORS, type CategorySlug } from "@/lib/competition-categories";
import type { FeastTheme } from "@/components/feast/feast-shared";

const fieldBox: React.CSSProperties = {
  background: "rgba(255,255,255,0.72)",
};

export function StaticField({
  label, value, theme, icon, type = "text", dataTour,
}: {
  label: string;
  value: string;
  theme: FeastTheme;
  icon?: "user" | "phone" | "calendar";
  type?: string;
  dataTour?: string;
}) {
  return (
    <div className="mb-3" data-tour={dataTour}>
      <label
        className="block text-[11.5px] font-semibold mb-1.5 tracking-wider"
        style={{ fontFamily: "var(--font-poppins), sans-serif", color: theme.sub }}
      >
        {label}
      </label>
      <div
        className="flex items-center gap-2.5 px-3.5 rounded-[14px]"
        style={{ ...fieldBox, border: `1px solid ${theme.hairline}` }}
      >
        {icon === "user" && <User size={16} color={theme.faint} />}
        {icon === "phone" && <Phone size={16} color={theme.faint} />}
        {icon === "calendar" && <Calendar size={16} color={theme.faint} />}
        <input
          readOnly
          value={value}
          type={type}
          className="flex-1 border-none outline-none bg-transparent text-[14.5px] py-3"
          style={{ color: theme.text, fontFamily: "Inter, sans-serif" }}
        />
      </div>
    </div>
  );
}

export function StaticCategoryPill({ slug, theme, dataTour }: { slug: CategorySlug | ""; theme: FeastTheme; dataTour?: string }) {
  if (!slug) return null;
  const label = CATEGORY_LABELS[slug];
  const color = CATEGORY_COLORS[slug] || theme.lavender;
  return (
    <div
      data-tour={dataTour}
      className="flex items-center gap-2 px-3.5 py-2 rounded-[12px] mb-3"
      style={{ background: color + "18", border: `1px solid ${color}44` }}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      <span
        className="text-[12.5px] font-semibold"
        style={{ fontFamily: "var(--font-poppins), sans-serif", color }}
      >
        Competition Category: <strong>{label}</strong>
      </span>
    </div>
  );
}

export function StaticGenderChips({ value, theme, dataTour }: { value: "boy" | "girl" | "other"; theme: FeastTheme; dataTour?: string }) {
  const options = [
    { value: "boy", label: "Boy" },
    { value: "girl", label: "Girl" },
  ] as const;
  return (
    <div className="mb-3" data-tour={dataTour}>
      <label
        className="block text-[11.5px] font-semibold mb-1.5 tracking-wider"
        style={{ fontFamily: "var(--font-poppins), sans-serif", color: theme.sub }}
      >
        Gender
      </label>
      <div className="flex gap-2">
        {options.map((o) => {
          const on = value === o.value;
          return (
            <div
              key={o.value}
              className="flex-1 py-2.5 rounded-[12px] font-semibold text-[13px] text-center"
              style={{
                fontFamily: "var(--font-poppins), sans-serif",
                background: on ? "linear-gradient(135deg, #6B46FF, #A78BFA)" : "rgba(255,255,255,0.72)",
                color: on ? "#fff" : theme.sub,
                border: on ? "none" : `1px solid ${theme.hairline}`,
                boxShadow: on ? "0 6px 16px rgba(107,70,255,0.3)" : "none",
              }}
            >
              {o.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ShakhaRow({ name, theme, dataTour }: { name: string; theme: FeastTheme; dataTour?: string }) {
  return (
    <div
      data-tour={dataTour}
      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[14px]"
      style={{ background: theme.fillStrong, border: `1px solid ${theme.purple}22` }}
    >
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: theme.purple }} />
      <span className="text-[13px] font-semibold" style={{ color: theme.text }}>{name}</span>
      <span className="text-[11.5px] ml-auto" style={{ color: theme.faint }}>Your Shakha</span>
    </div>
  );
}
