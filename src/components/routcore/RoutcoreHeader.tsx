"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { RoutcoreLogo } from "./RoutcoreLogo";
import { Container, ButtonLink } from "./ui";
import { NAV } from "./content";

export function RoutcoreHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 h-16 border-b transition-colors duration-200 ${
        scrolled ? "border-rc-line bg-white/85 backdrop-blur-md" : "border-transparent bg-white/0"
      }`}
    >
      <Container className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <RoutcoreLogo />
          <span aria-hidden="true" className="hidden h-4 w-px bg-rc-line sm:block" />
          <Link
            href="/"
            className="hidden text-[13px] text-rc-muted transition-colors hover:text-rc-ink sm:block"
          >
            by Flowfiy
          </Link>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[14px] font-medium text-rc-body transition-colors hover:text-rc-ink"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <ButtonLink href="#contact" size="sm">
            Book a consultation
          </ButtonLink>
        </div>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="routcore-mobile-nav"
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-lg text-rc-ink md:hidden"
        >
          {open ? (
            <X className="h-5 w-5" strokeWidth={1.75} />
          ) : (
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          )}
          <span className="sr-only">Menu</span>
        </button>
      </Container>

      {open && (
        <div
          id="routcore-mobile-nav"
          className="absolute inset-x-0 top-16 border-b border-rc-line bg-white px-5 pb-6 pt-2 shadow-sm md:hidden"
        >
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block border-b border-rc-line py-3 text-[16px] text-rc-ink"
            >
              {item.label}
            </a>
          ))}
          <div onClick={() => setOpen(false)}>
            <ButtonLink href="#contact" className="mt-5 w-full">
              Book a consultation
            </ButtonLink>
          </div>
        </div>
      )}
    </header>
  );
}
