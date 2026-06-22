"use client";

interface BlobsProps {
  mode: false | "soft" | "vivid";
}

export function Blobs({ mode }: BlobsProps) {
  if (!mode) return null;
  const o = mode === "vivid" ? 0.5 : 0.3;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Teal — top right */}
      <div
        className="absolute rounded-full blur-[44px]"
        style={{
          top: -30,
          right: -60,
          width: 230,
          height: 230,
          background: `radial-gradient(circle at 40% 40%, rgba(127,208,232,${o}), rgba(159,230,214,${o * 0.7}))`,
        }}
      />
      {/* Coral — mid left */}
      <div
        className="absolute rounded-full blur-[46px]"
        style={{
          top: 320,
          left: -80,
          width: 240,
          height: 240,
          background: `radial-gradient(circle at 40% 40%, rgba(246,184,154,${o}), rgba(241,155,180,${o * 0.7}))`,
        }}
      />
      {/* Lavender — bottom right */}
      <div
        className="absolute rounded-full blur-[48px]"
        style={{
          bottom: 90,
          right: -60,
          width: 240,
          height: 240,
          background: `radial-gradient(circle at 40% 40%, rgba(199,182,247,${o}), rgba(169,139,240,${o * 0.7}))`,
        }}
      />
    </div>
  );
}
