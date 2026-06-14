"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Fires the CompleteRegistration pixel event for signups that can't fire it
 * inline. Currently: Google OAuth — the callback redirects new users here with
 * ?newSignup=1 (a server redirect can't run the browser pixel). Email signups
 * fire CompleteRegistration on the signup form itself, so they never carry this
 * param — no double-count.
 *
 * The param is stripped up-front so a re-render/StrictMode re-invoke can't
 * double-fire, then we wait for fbq to be ready (it may not be on the first
 * client tick) before tracking.
 */
export function SignupConversionTracker() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("newSignup") !== "1") return;

    // Strip the flag immediately so this can only run once.
    params.delete("newSignup");
    const qs = params.toString();
    window.history.replaceState(
      {},
      "",
      window.location.pathname + (qs ? `?${qs}` : "")
    );

    // fbq may not be defined yet on the first tick — poll briefly, then fire.
    let tries = 0;
    const fire = () => {
      if (typeof window.fbq === "function") {
        window.fbq("track", "CompleteRegistration", { content_name: "google_signup" });
      } else if (tries++ < 20) {
        setTimeout(fire, 150);
      }
    };
    fire();
  }, []);

  return null;
}
