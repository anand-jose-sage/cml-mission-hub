import { ArrowLeft, Clock, Calendar, Play, Volume2, Paperclip } from "lucide-react";
import Link from "next/link";
import { COLORS } from "@/lib/theme";

interface ContentPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ContentPage({ params }: ContentPageProps) {
  const { slug } = await params;

  // In production, fetch from Supabase:
  // const item = await getContentBySlug(slug);
  // For now, show a placeholder layout matching the design system.

  return (
    <div className="max-w-md mx-auto min-h-dvh bg-gradient-to-b from-[#E7DBFF] via-[#F1D7F4] to-[#FFE2D2]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4">
        <Link
          href="/"
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(255,255,255,0.5)",
            boxShadow: "0 2px 8px rgba(107,70,255,0.1)",
          }}
        >
          <ArrowLeft size={20} color={COLORS.text} />
        </Link>
        <div className="flex-1">
          <h1
            className="font-[family-name:var(--font-poppins)] font-semibold text-lg leading-tight"
            style={{ color: COLORS.text }}
          >
            {slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </h1>
        </div>
      </div>

      {/* Content body */}
      <div className="px-5 pb-10">
        {/* Hero image placeholder */}
        <div
          className="w-full h-48 rounded-3xl mb-5 flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #EDE9FE, #DDD6FE)",
          }}
        >
          <span className="text-[#6B46FF] font-mono text-xs uppercase tracking-wide opacity-60 px-3 py-1 border border-dashed border-[#6B46FF]/30 rounded-md bg-white/40">
            content image
          </span>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-4 mb-5">
          <span className="inline-flex items-center gap-1.5 text-sm" style={{ color: COLORS.sub }}>
            <Calendar size={14} />
            Oct 1, 2024
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm" style={{ color: COLORS.sub }}>
            <Clock size={14} />
            3 min read
          </span>
        </div>

        {/* Article card */}
        <div
          className="rounded-3xl p-5"
          style={{
            background: "rgba(255,255,255,0.5)",
            border: "1px solid rgba(255,255,255,0.9)",
            backdropFilter: "blur(16px) saturate(180%)",
            boxShadow: "0 14px 38px rgba(107,70,255,0.16)",
          }}
        >
          <p className="text-sm leading-relaxed mb-4" style={{ color: COLORS.text }}>
            This is a placeholder for the full content detail view. When connected to Supabase,
            it will render the article body, embedded media, and attachments dynamically based
            on the content type.
          </p>
          <p className="text-sm leading-relaxed mb-4" style={{ color: COLORS.sub }}>
            Supported content types include articles (with rich text), videos (with embedded player),
            audio reflections (with waveform player), image galleries, and downloadable attachments.
          </p>

          {/* Media section placeholder */}
          <div className="mt-5 space-y-3">
            <div
              className="flex items-center gap-3 p-3 rounded-2xl"
              style={{ background: "rgba(107,70,255,0.06)" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: COLORS.purple }}
              >
                <Play size={16} fill="#fff" color="#fff" className="ml-0.5" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: COLORS.text }}>Video attachment</div>
                <div className="text-xs" style={{ color: COLORS.faint }}>MP4 - 2:34</div>
              </div>
            </div>
            <div
              className="flex items-center gap-3 p-3 rounded-2xl"
              style={{ background: "rgba(107,70,255,0.06)" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: COLORS.purple }}
              >
                <Volume2 size={16} color="#fff" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: COLORS.text }}>Audio reflection</div>
                <div className="text-xs" style={{ color: COLORS.faint }}>MP3 - 5:12</div>
              </div>
            </div>
            <div
              className="flex items-center gap-3 p-3 rounded-2xl"
              style={{ background: "rgba(107,70,255,0.06)" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(107,70,255,0.15))",
                  border: "1px solid rgba(107,70,255,0.2)",
                }}
              >
                <Paperclip size={16} color={COLORS.purple} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: COLORS.text }}>Document</div>
                <div className="text-xs" style={{ color: COLORS.faint }}>PDF - 1.2 MB</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
