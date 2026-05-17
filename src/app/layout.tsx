import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flowfiy — AI-Powered Sales Outreach",
  description:
    "Claude-powered outbound intelligence platform. Research leads, analyze companies, and generate personalized outreach at scale.",
  keywords: ["outbound sales", "lead generation", "AI sales", "cold email", "Claude AI"],
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
