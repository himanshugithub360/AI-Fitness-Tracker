import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const displayFace = Bricolage_Grotesque({
  variable: "--font-display-face",
  subsets: ["latin"],
});

const bodyFace = Instrument_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const codeFace = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "APEX",
  description: "AI fitness tracker: snap meals, log by voice, and get coached on your form.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${displayFace.variable} ${bodyFace.variable} ${codeFace.variable} h-full`}
      suppressHydrationWarning
    >
      {/* Browser extensions such as Grammarly add attributes to these two tags before React
          loads, which causes a harmless hydration warning. suppressHydrationWarning hides it. */}
      <body className="relative flex min-h-full flex-col" suppressHydrationWarning>
        <div className="aurora pointer-events-none fixed inset-0" aria-hidden="true">
          <div className="aurora-grid absolute inset-0" />
        </div>
        <div className="relative flex min-h-full flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
