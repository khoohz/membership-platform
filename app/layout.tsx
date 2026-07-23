import type { Metadata } from "next";
import {
  Fraunces,
  Plus_Jakarta_Sans,
  Space_Grotesk,
  JetBrains_Mono,
  Bricolage_Grotesque,
  Baloo_2,
  Nunito,
} from "next/font/google";
import "./globals.css";

// Every theme's fonts are loaded once here and exposed as CSS variables; a theme
// definition (lib/themes) picks which variable fills the --font-display/body/mono
// roles. Adding a theme that reuses these families needs no font change.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-fraunces",
  display: "swap",
});
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});
const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-baloo",
  display: "swap",
});
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Membership Platform",
  description: "White-label membership for Malaysian F&B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fontVars = [fraunces, jakarta, spaceGrotesk, jetbrainsMono, bricolage, baloo, nunito]
    .map((f) => f.variable)
    .join(" ");
  return (
    <html lang="en">
      <body className={fontVars}>{children}</body>
    </html>
  );
}
