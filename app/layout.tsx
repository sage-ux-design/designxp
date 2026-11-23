import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Doto, Geist_Mono, Press_Start_2P } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "@/components/providers";
import "./globals.css";

const pixel = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-press-start", display: "swap" });
const body = Atkinson_Hyperlegible({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-atkinson", display: "swap" });
const led = Doto({ weight: ["700", "900"], subsets: ["latin"], variable: "--font-doto", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: { default: "DesignXP · Level up your design thinking", template: "%s · DesignXP" },
  description:
    "An arcade-inspired learning game for UX/UI and product designers. Play short challenges, unlock knowledge cards, earn XP and climb the leaderboard.",
};

export const viewport: Viewport = {
  themeColor: "#7a0f2c",
  width: "device-width",
  initialScale: 1,
};

/** Applies saved display settings before paint to avoid a flash of the wrong theme. */
const settingsScript = `try{var s=JSON.parse(localStorage.getItem('designxp:settings:v1')||'{}');var d=document.documentElement;d.dataset.theme=s.theme||'day';d.dataset.crt=s.crt===false?'off':'on';if(s.reducedMotion===true)d.dataset.motion='reduced';}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${pixel.variable} ${led.variable} ${body.variable} ${mono.variable} h-full antialiased`}
      data-theme="day"
      data-crt="on"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: settingsScript }} />
      </head>
      <body className="min-h-full flex flex-col font-sans text-[17px] leading-relaxed">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
