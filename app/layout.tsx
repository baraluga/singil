import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600"],
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-dm-serif",
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Singil — Split bills, collect payments",
  description: "Split bills and collect payments easily",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Singil",
  },
  other: {
    "theme-color": "#1A1612",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${dmSerifDisplay.variable}`}>
        {children}
        <footer className="site-footer">
          Built with spare time and Claude Code ·{" "}
          <a href="https://github.com/baraluga/singil" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </footer>
      </body>
    </html>
  );
}
