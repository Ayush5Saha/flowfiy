import Link from "next/link";
import Image from "next/image";

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Flowfiy" width={90} height={24} />
        </Link>
        <span className="text-xs text-zinc-500 bg-zinc-900/60 border border-white/8 rounded-full px-3 py-1">Affiliate Portal</span>
      </header>
      <main>{children}</main>
    </div>
  );
}
