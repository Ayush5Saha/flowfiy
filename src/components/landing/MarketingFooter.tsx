import Link from "next/link";
import { Zap, Twitter, Linkedin, Github, Mail } from "lucide-react";

const footerLinks = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Integrations", href: "/#features" },
    ],
  },
  {
    heading: "Compare",
    links: [
      { label: "Flowfiy vs Clay", href: "/vs/clay" },
      { label: "Flowfiy vs Apollo", href: "/vs/apollo" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Use Cases", href: "/use-cases/ai-lead-generation" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Refund & Cancellation", href: "/refund" },
    ],
  },
];

const socials = [
  { icon: Twitter, href: "https://twitter.com/flowfiy", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com/company/flowfiy", label: "LinkedIn" },
  { icon: Github, href: "https://github.com/flowfiy", label: "GitHub" },
  { icon: Mail, href: "mailto:support@flowfiy.com", label: "Email" },
];

export function MarketingFooter() {
  return (
    <footer className="bg-[#030305] border-t border-white/5 pt-16 pb-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">

        {/* Top row — brand + links */}
        <div className="flex flex-col lg:flex-row gap-12 mb-14">

          {/* Brand */}
          <div className="lg:w-72 shrink-0">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-base">Flowfiy</span>
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed mb-5">
              AI-powered outbound sales platform. Bring your own Claude key, generate qualified leads, and send hyper-personalized outreach — at scale.
            </p>
            <div className="flex items-center gap-3">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/20 hover:bg-white/[0.07] transition-all"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links grid */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm">
            {footerLinks.map(({ heading, links }) => (
              <div key={heading}>
                <p className="font-semibold text-zinc-300 mb-3">{heading}</p>
                <ul className="space-y-2.5">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="text-zinc-500 hover:text-zinc-200 transition-colors"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* CTA strip */}
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
          <div>
            <p className="text-sm font-medium text-white mb-0.5">Start generating leads for free</p>
            <p className="text-xs text-zinc-500">50 free generations. No credit card required.</p>
          </div>
          <Link
            href="/signup"
            className="shrink-0 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Get started free →
          </Link>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-600">© 2026 Flowfiy. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-zinc-600">
            <span>Built with Claude AI · Powered by Anthropic</span>
            <span className="hidden sm:inline">·</span>
            <Link href="/contact" className="hover:text-zinc-400 transition-colors hidden sm:inline">support@flowfiy.com</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
