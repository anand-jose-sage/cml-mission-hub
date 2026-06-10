"use client";

interface BlobsProps {
  mode: false | "soft" | "vivid";
}

export function Blobs({ mode }: BlobsProps) {
  if (!mode) return null;
  const o = mode === "vivid" ? 0.55 : 0.32;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute rounded-full blur-[34px]"
        style={{
          top: 60,
          right: -50,
          width: 200,
          height: 200,
          background: `rgba(167,139,250,${o})`,
        }}
      />
      <div
        className="absolute rounded-full blur-[34px]"
        style={{
          top: 360,
          left: -70,
          width: 220,
          height: 220,
          background: `rgba(245,197,66,${o * 0.7})`,
        }}
      />
      <div
        className="absolute rounded-full blur-[34px]"
        style={{
          bottom: 120,
          right: -40,
          width: 200,
          height: 200,
          background: `rgba(236,72,153,${o * 0.6})`,
        }}
      />
    </div>
  );
}
