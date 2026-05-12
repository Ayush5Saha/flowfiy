import Link from "next/link";
import { Zap } from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="bg-[#030305] border-t border-white/5 py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10 mb-12">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">Flowfiy</span>
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed">
              AI-powered outbound sales platform. Bring your own Claude key, generate qualified leads, send personalized outreach at scale.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm">
            <div>
              <p className="font-medium text-zinc-300 mb-3">Product</p>
              <ul className="space-y-2">
                {[["Features", "/#features"], ["How it works", "/#how-it-works"], ["Pricing", "/#pricing"], ["Changelog", "/changelog"]].map(([l, h]) => (
                  <li key={l}><Link href={h} className="text-zinc-500 hover:text-zinc-300 transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-zinc-300 mb-3">Resources</p>
              <ul className="space-y-2">
                {[["Blog", "/blog"], ["Use Cases", "/use-cases/ai-lead-generation"], ["About", "/about"], ["vs Clay", "/vs/clay"]].map(([l, h]) => (
                  <li key={l}><Link href={h} className="text-zinc-500 hover:text-zinc-300 transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-zinc-300 mb-3">Account</p>
              <ul className="space-y-2">
                {[["Sign in", "/login"], ["Sign up", "/signup"], ["Dashboard", "/dashboard"]].map(([l, h]) => (
                  <li key={l}><Link href={h} className="text-zinc-500 hover:text-zinc-300 transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-zinc-300 mb-3">Legal</p>
              <ul className="space-y-2">
                {[["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"], ["Refund Policy", "/refund"], ["Contact Us", "/contact"]].map(([l, h]) => (
                  <li key={l}><Link href={h} className="text-zinc-500 hover:text-zinc-300 transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">© 2026 Flowfiy. All rights reserved.</p>
          <p className="text-xs text-zinc-600">Built with Claude AI · Powered by Anthropic</p>
        </div>
      </div>
    </footer>
  );
}
