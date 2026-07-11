import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Flowfiy — AI Sales Engine Support & Sales India",
  description:
    "Get in touch with the Flowfiy team. Questions about our AI sales engine — finding, researching, and qualifying leads on Google Maps — pricing for India, integrations, or enterprise plans — we reply within 24 hours.",
  keywords: [
    "contact Flowfiy",
    "Flowfiy support India",
    "AI sales engine contact",
    "Flowfiy pricing India",
    "B2B AI sales tool support India",
    "Flowfiy India sales",
  ],
  openGraph: {
    title: "Contact Flowfiy — AI Sales Engine India",
    description: "Questions about Flowfiy's AI sales engine in India? Reach out — we reply within 24 hours.",
    url: "/contact",
  },
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
