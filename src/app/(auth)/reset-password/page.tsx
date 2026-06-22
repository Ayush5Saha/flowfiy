"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Lock } from "lucide-react";

/**
 * Destination of the password-reset email link. The /auth/callback route
 * exchanges the recovery code for a session and redirects here, so the user is
 * authenticated by the time they land — we just need to set the new password.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [validSession, setValidSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Confirm a recovery/auth session exists before showing the form.
  useEffect(() => {
    const supabase = createClient();

    // Supabase emits PASSWORD_RECOVERY once the recovery token is processed.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setValidSession(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      setValidSession(Boolean(data.session));
      setChecking(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
        return;
      }
      setDone(true);
      // Give the user a moment to read the success state, then move on.
      setTimeout(() => router.push("/dashboard"), 1800);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 shadow-2xl text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Password updated</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Your password has been changed. Redirecting you to your dashboard…
        </p>
        <Link href="/dashboard" className="text-primary text-sm hover:underline">
          Go to dashboard
        </Link>
      </div>
    );
  }

  if (!checking && !validSession) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 shadow-2xl text-center">
        <h2 className="text-xl font-semibold mb-2">Reset link expired</h2>
        <p className="text-muted-foreground text-sm mb-6">
          This password reset link is invalid or has expired. Request a fresh one to continue.
        </p>
        <Link href="/forgot-password" className="text-primary text-sm hover:underline">
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-8 shadow-2xl">
      <Link href="/login" className="flex items-center gap-1.5 text-muted-foreground text-sm mb-6 hover:text-foreground transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
      </Link>
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Lock className="w-6 h-6 text-primary" />
      </div>
      <h1 className="text-2xl font-semibold mb-1">Set a new password</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Choose a strong password you don&apos;t use anywhere else.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1.5">New password</label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="w-full px-3 py-2 pr-10 bg-secondary border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Confirm password</label>
          <input
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Re-enter your new password"
            className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          disabled={loading || checking}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
