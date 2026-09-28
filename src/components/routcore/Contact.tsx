"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, ChevronDown, Loader2, MessageCircle } from "lucide-react";
import { buttonClass, Eyebrow, Heading, Lead, Section, SHADOW } from "./ui";
import { CONTACT, CONTACT_SECTION, FOCUS_OPTIONS } from "./content";
import { trackMetaPixel } from "@/lib/meta-pixel";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  companyName: "",
  packageTier: "",
  message: "",
  company: "", // honeypot
};

export function Contact() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  // Ported from the pre-redesign RoutcoreContact.tsx: same endpoint, same JSON
  // keys, same loading/error/success handling. Only the packageTier fallback
  // ("Not specified" instead of defaulting to the first option) is new, to
  // match this form's unselected placeholder state.
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/routcore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          packageTier: form.packageTier || "Not specified",
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? `Something went wrong. Please email us directly at ${CONTACT.email}`);
        return;
      }
      // The conversion the Meta ads optimise on. Fired only once the enquiry is
      // accepted; a no-op when the visitor declined tracking or blocks the pixel.
      trackMetaPixel("Lead", {
        content_name: "Routcore consultation request",
        content_category: form.packageTier || "Not specified",
      });
      setSent(true);
      setForm(EMPTY_FORM);
    } catch {
      setError(`Something went wrong. Please email us directly at ${CONTACT.email}`);
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "h-11 w-full rounded-lg border border-rc-line bg-white px-3.5 text-[15px] text-rc-ink placeholder:text-rc-faint transition focus:border-rc-teal focus:outline-none focus:ring-4 focus:ring-rc-teal/15";
  const labelClass = "mb-2 block text-[13.5px] font-medium text-rc-ink";

  return (
    <Section id="contact" tone="ink">
      <div className="grid gap-12 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-12">
        {/*
          Mobile reads top to bottom: heading -> form -> steps/contacts, so the
          form isn't buried under a screen of copy on a phone. Desktop keeps
          the original 2-column look via explicit grid placement: block A and
          block B stack as the left column (row1/row2), the form spans both
          rows on the right. DOM order stays A, form, B for that mobile flow.
        */}
        <div className="lg:col-span-5 lg:row-start-1">
          <Eyebrow onDark>{CONTACT_SECTION.eyebrow}</Eyebrow>
          <Heading as="h2" onDark className="mt-5">
            {CONTACT_SECTION.title}
          </Heading>
          <Lead onDark className="mt-5">
            {CONTACT_SECTION.body}
          </Lead>
        </div>

        <div
          className={`rounded-2xl bg-white p-6 sm:p-9 ${SHADOW} lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1`}
        >
          {sent ? (
            <div className="flex min-h-[22rem] flex-col items-center justify-center text-center">
              <span className="mb-5 grid h-12 w-12 place-items-center rounded-full bg-rc-teal-soft">
                <Check className="h-6 w-6 text-rc-teal-deep" strokeWidth={2} />
              </span>
              <p className="text-[20px] font-semibold text-rc-ink">{CONTACT_SECTION.success.title}</p>
              <p className="mt-3 max-w-sm text-[15px] text-rc-body">{CONTACT_SECTION.success.body}</p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-6 text-[13px] text-rc-muted hover:text-rc-ink"
              >
                Send another request
              </button>
            </div>
          ) : (
            <>
              <p className="text-[20px] font-semibold text-rc-ink">{CONTACT_SECTION.formTitle}</p>
              <p className="mt-1 text-[14px] text-rc-muted">{CONTACT_SECTION.formBody}</p>

              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                {/* Honeypot: hidden from humans, catches bots */}
                <input
                  type="text"
                  name="company"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="absolute left-[-9999px] h-px w-px opacity-0"
                />

                {error && <p className="text-[14px] text-red-600">{error}</p>}

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Name*</label>
                    <input
                      type="text"
                      required
                      maxLength={120}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Jane Smith"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Work email*</label>
                    <input
                      type="email"
                      required
                      maxLength={200}
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@company.com"
                      className={fieldClass}
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Company</label>
                    <input
                      type="text"
                      maxLength={160}
                      value={form.companyName}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      placeholder="Acme Inc."
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Phone</label>
                    <input
                      type="tel"
                      maxLength={40}
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+91 90000 00000"
                      className={fieldClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>What do you want to automate first?</label>
                  <div className="relative">
                    <select
                      value={form.packageTier}
                      onChange={(e) => setForm({ ...form, packageTier: e.target.value })}
                      className={`${fieldClass} appearance-none pr-10`}
                    >
                      <option value="">Select an area</option>
                      {FOCUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-rc-muted"
                      strokeWidth={1.75}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>What does your team do over and over every day?*</label>
                  <textarea
                    required
                    rows={5}
                    maxLength={5000}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className={`${fieldClass} h-auto resize-none py-3`}
                  />
                </div>

                <button type="submit" disabled={loading} className={`${buttonClass("primary")} mt-6 w-full`}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                      {CONTACT_SECTION.sending}
                    </>
                  ) : (
                    <>
                      {CONTACT_SECTION.submit}
                      <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
                    </>
                  )}
                </button>

                <p className="mt-4 text-center text-[12.5px] text-rc-muted">{CONTACT_SECTION.privacyNote}</p>
              </form>
            </>
          )}
        </div>

        <div className="lg:col-span-5 lg:row-start-2">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-white/50">
            {CONTACT_SECTION.stepsTitle}
          </p>
          <ol className="mt-5 space-y-4">
            {CONTACT_SECTION.steps.map((step, i) => (
              <li key={step} className="flex gap-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/20 text-[13px] font-semibold text-rc-aqua">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-[15px] text-white/85">{step}</span>
              </li>
            ))}
          </ol>

          <div className="mt-10 space-y-3 border-t border-white/10 pt-8">
            {CONTACT.founders.map((founder) => (
              <p key={founder.name} className="text-[14px]">
                <span className="font-medium text-white">{founder.name}</span>{" "}
                <a href={`tel:${founder.phoneHref}`} className="text-white/70 hover:text-white">
                  {founder.phone}
                </a>
              </p>
            ))}
            <p className="text-[14px]">
              <a href={`mailto:${CONTACT.email}`} className="text-white/70 hover:text-white">
                {CONTACT.email}
              </a>
            </p>
            <a
              href={CONTACT.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-[14px] font-medium text-white hover:bg-white/5"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
              Message us on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}
