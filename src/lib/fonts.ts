import { Comic_Neue, Plus_Jakarta_Sans } from "next/font/google";

// Optional reading fonts members can pick under Appearance. Self-hosted by next/font (so the
// Git track's cross-origin isolation never blocks them) and not preloaded: the files only
// download once someone picks that font.
export const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], preload: false, display: "swap" });

// Comic Sans is a Windows and Mac system font; Comic Neue stands in on Chromebooks and Linux.
export const comicNeue = Comic_Neue({
  variable: "--font-comic-neue",
  subsets: ["latin"],
  weight: ["400", "700"],
  preload: false,
  display: "swap",
});
