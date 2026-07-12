"use client";

import { useEffect, useRef } from "react";

export function isInstagramUrl(url: string) {
  return /instagram\.com\/(reel|p|tv)\//.test(url);
}

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

export function InstagramEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLQuoteElement>(null);

  useEffect(() => {
    const process = () => window.instgrm?.Embeds.process();

    if (window.instgrm) {
      process();
      return;
    }

    const existing = document.getElementById("instagram-embed-script") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", process);
      return () => existing.removeEventListener("load", process);
    }

    const script = document.createElement("script");
    script.id = "instagram-embed-script";
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = process;
    document.body.appendChild(script);
  }, [url]);

  return (
    <blockquote
      ref={ref}
      className="instagram-media"
      data-instgrm-permalink={url}
      data-instgrm-version="14"
      style={{ background: "#fff", border: 0, margin: 0, maxWidth: 540, width: "100%", minWidth: 280 }}
    />
  );
}
