import type { Metadata } from "next";
import { Manrope } from "next/font/google";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CML Kalpetta — Now Digital",
  description:
    "Cherupushpa Mission League · Kalpetta Mekhala — Mission, Formation, Community. Now Digital.",
};

export default function LaunchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={manrope.variable}
      style={{
        background: "#05030F",
        color: "#fff",
        fontFamily: "var(--font-manrope), system-ui, sans-serif",
        minHeight: "100vh",
      }}
    >
      {children}
    </div>
  );
}
