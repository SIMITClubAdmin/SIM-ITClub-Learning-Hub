import type { Metadata } from "next";
import { Chakra_Petch, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { CustomCursor } from "@/components/effects/CustomCursor";
import { PixelGridBackground } from "@/components/effects/PixelGridBackground";
import { SiteHeader } from "@/components/layout/SiteHeader";
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
    <html lang="en" className={`${chakra.variable} ${grotesk.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <PixelGridBackground />
        <SiteHeader />
        {children}
        <CustomCursor />
      </body>
    </html>
  );
}
