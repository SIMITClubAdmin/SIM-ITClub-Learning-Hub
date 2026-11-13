import type { Metadata } from "next";
import { Chakra_Petch, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { ThemeCustomizationProvider } from "@/components/appearance/ThemeCustomizationProvider";
import { CustomCursor } from "@/components/effects/CustomCursor";
import { GlobalThemeBackground } from "@/components/effects/GlobalThemeBackground";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { APPEARANCE_SCRIPT } from "@/lib/appearance-config";
import { comicNeue, jakarta } from "@/lib/fonts";
import "./globals.css";

const chakra = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ITCamp Learning Hub",
  description: "HTML, CSS and JavaScript lessons and challenges for SIM IT Club ITCamp members.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The appearance script below sets data-font, data-palette and data-world on <html>
    // before first paint, so React must accept attributes it did not render.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${chakra.variable} ${grotesk.variable} ${jetbrains.variable} ${jakarta.variable} ${comicNeue.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeCustomizationProvider />
        <GlobalThemeBackground />
        <SiteHeader />
        {children}
        <CustomCursor />
      </body>
    </html>
  );
}
