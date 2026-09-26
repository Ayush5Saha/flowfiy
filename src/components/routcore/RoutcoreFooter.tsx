import Link from "next/link";
import { RoutcoreLogo } from "./RoutcoreLogo";
import { Container } from "./ui";
import { FOOTER } from "./content";

export function RoutcoreFooter() {
  return (
    <footer className="bg-rc-ink">
      <Container className="flex flex-col gap-6 border-t border-white/10 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <RoutcoreLogo onDark />
          <p className="mt-3 text-[13.5px] text-white/55">{FOOTER.blurb}</p>
        </div>

        <nav className="flex flex-wrap items-center gap-6 text-[14px] text-white/65">
          {FOOTER.links.map((link) =>
            link.href.startsWith("#") ? (
              <a key={link.href} href={link.href} className="hover:text-white">
                {link.label}
              </a>
            ) : (
              <Link key={link.href} href={link.href} className="hover:text-white">
                {link.label}
              </Link>
            )
          )}
        </nav>

        <p className="text-[13px] text-white/45">© {new Date().getFullYear()} Flowfiy. All rights reserved.</p>
      </Container>
    </footer>
  );
}
