import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { CustomCursor } from "@/components/effects/CustomCursor";
import { PixelGridBackground } from "@/components/effects/PixelGridBackground";
import { SiteHeader } from "@/components/layout/SiteHeader";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ITCamp Learning Hub",
  description: "HTML, CSS and JavaScript lessons and practice for SIM IT Club ITCamp members.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <PixelGridBackground />
        <SiteHeader />
        {children}
        <CustomCursor />
      </body>
    </html>
  );
}
