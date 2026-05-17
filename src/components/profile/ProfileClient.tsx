"use client";

import { useState } from "react";
import {
  User, Mail, Lock, Shield, Trash2,
  CheckCircle, AlertCircle, Loader2, Eye, EyeOff, Copy,
} from "lucide-react";

interface ProfileClientProps {
  user: {
    id: string;
    email: string;
    fullName: string;
    createdAt: string;
    isOAuthUser: boolean;
  };
  membership: {
    role: string;
    orgName: string;
    orgPlan: string;
  };
}

function getInitials(name: string, email: string) {
  if (name?.trim()) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`flex items-start gap-2.5 p-3 rounded-lg text-sm border ${
      type === "success"
        ? "bg-green-500/10 border-green-500/20 text-green-400"
        : "bg-destructive/10 border-destructive/20 text-destructive"
    }`}>
      {type === "success"
        ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
        : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
      {message}
    </div>
  );
}

export function ProfileClient({ user, membership }: ProfileClientProps) {
  const initials = getInitials(user.fullName, user.email);
  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "long", year: "numeric",
  });

  const roleColors: Record<string, string> = {
    OWNER: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    ADMIN: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    MEMBER: "bg-secondary text-muted-foreground border-border",
  };

  const planColors: Record<string, string> = {
    FREE: "bg-secondary text-muted-foreground",
    STARTER: "bg-blue-500/10 text-blue-400",
    GROWTH: "bg-purple-500/10 text-purple-400",
    AGENCY: "bg-yellow-500/10 text-yellow-400",
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account details and security</p>
      </div>

      {/* Avatar + overview card */}
      <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shrink-0 select-none">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-lg truncate">{user.fullName || user.email.split("@")[0]}</p>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${roleColors[membership.role] ?? roleColors.MEMBER}`}>
              {membership.role}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${planColors[membership.orgPlan] ?? planColors.FREE}`}>
              {membership.orgPlan}
            </span>
            <span className="text-xs text-muted-foreground">· {membership.orgName}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">Member since</p>
          <p className="text-sm font-medium">{memberSince}</p>
        </div>
      </div>

      {/* Personal info */}
      <NameSection currentName={user.fullName} />

      {/* Email */}
      <EmailSection currentEmail={user.email} />

      {/* Password — only for email/password users */}
      {!user.isOAuthUser ? (
        <PasswordSection />
      ) : (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-1">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Password</h2>
          </div>
          <p className="text-xs text-muted-foreground ml-7">
            You signed in with Google. Password management is handled by your Google account.
          </p>
        </div>
      )}

      {/* Account info */}
      <AccountInfoSection userId={user.id} createdAt={user.createdAt} />

      {/* Danger zone */}
      <DangerZone />
    </div>
  );
}

/* ─── Name Section ────────────────────────────────────────────────────────── */
function NameSection({ currentName }: { currentName: string }) {
  const [name, setName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  async function handleSave() {
    if (!name.trim() || name.trim() === currentName) return;
    setLoading(true);
    setToast(null);
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: name }),
    });
    const data = await res.json() as { error?: string };
    setLoading(false);
    if (res.ok) {
      setToast({ msg: "Name updated successfully", type: "success" });
    } else {
      setToast({ msg: data.error ?? "Failed to update name", type: "error" });
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <User className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Personal Information</h2>
      </div>
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-muted-foreground">Full Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <button
        onClick={handleSave}
        disabled={loading || !name.trim() || name.trim() === currentName}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        Save Changes
      </button>
    </div>
  );
}

/* ─── Email Section ───────────────────────────────────────────────────────── */
function EmailSection({ currentEmail }: { currentEmail: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  async function handleChange() {
    if (!email.trim()) return;
    setLoading(true);
    setToast(null);
    const res = await fetch("/api/user/email", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json() as { error?: string; message?: string };
    setLoading(false);
    if (res.ok) {
      setToast({ msg: data.message ?? "Confirmation email sent", type: "success" });
      setEmail("");
    } else {
      setToast({ msg: data.error ?? "Failed to update email", type: "error" });
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Mail className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Email Address</h2>
      </div>
      {toast && <Toast message={toast.msg} type={toast.type} />}
      <div className="p-3 bg-secondary/50 rounded-lg">
        <p className="text-xs text-muted-foreground mb-0.5">Current email</p>
        <p className="text-sm font-medium">{currentEmail}</p>
      </div>
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-muted-foreground">New Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="new@email.com"
          className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground">
          A confirmation link will be sent to your new email address.
        </p>
      </div>
      <button
        onClick={handleChange}
        disabled={loading || !email.trim()}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        Send Confirmation
      </button>
    </div>
  );
}

/* ─── Password Section ────────────────────────────────────────────────────── */
function PasswordSection() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const strength = password.length === 0 ? null
    : password.length < 8 ? "weak"
    : password.length < 12 ? "fair"
    : /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) ? "strong"
    : "good";

  const strengthColors: Record<string, string> = {
    weak: "bg-red-500",
    fair: "bg-yellow-500",
    good: "bg-blue-500",
    strong: "bg-green-500",
  };
  const strengthWidths: Record<string, string> = {
    weak: "w-1/4", fair: "w-2/4", good: "w-3/4", strong: "w-full",
  };

  async function handleChange() {
    if (password !== confirm) {
      setToast({ msg: "Passwords do not match", type: "error" });
      return;
    }
    setLoading(true);
    setToast(null);
    const res = await fetch("/api/user/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json() as { error?: string };
    setLoading(false);
    if (res.ok) {
      setToast({ msg: "Password updated successfully", type: "success" });
      setPassword("");
      setConfirm("");
    } else {
      setToast({ msg: data.error ?? "Failed to update password", type: "error" });
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Lock className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Change Password</h2>
      </div>
      {toast && <Toast message={toast.msg} type={toast.type} />}

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground">New Password</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full px-3 py-2 pr-10 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {strength && (
            <div className="space-y-1">
              <div className="h-1 bg-secondary rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${strengthColors[strength]} ${strengthWidths[strength]}`} />
              </div>
              <p className={`text-xs capitalize ${
                strength === "weak" ? "text-red-400" :
                strength === "fair" ? "text-yellow-400" :
                strength === "good" ? "text-blue-400" : "text-green-400"
              }`}>
                {strength} password
              </p>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground">Confirm New Password</label>
          <div className="relative">
            <input
              type={showCf ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat new password"
              className="w-full px-3 py-2 pr-10 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => setShowCf(!showCf)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showCf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirm && password !== confirm && (
            <p className="text-xs text-red-400">Passwords do not match</p>
          )}
        </div>
      </div>

      <button
        onClick={handleChange}
        disabled={loading || !password || !confirm || password !== confirm || password.length < 8}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        Update Password
      </button>
    </div>
  );
}

/* ─── Account Info Section ────────────────────────────────────────────────── */
function AccountInfoSection({ userId, createdAt }: { userId: string; createdAt: string }) {
  const [copied, setCopied] = useState(false);

  function copyId() {
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Shield className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Account Information</h2>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
          <span className="text-xs text-muted-foreground">User ID</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-foreground/70">{userId.slice(0, 8)}...{userId.slice(-4)}</span>
            <button onClick={copyId} className="text-muted-foreground hover:text-foreground transition-colors">
              {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
          <span className="text-xs text-muted-foreground">Account created</span>
          <span className="text-xs font-medium">
            {new Date(createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-xs text-muted-foreground">Auth provider</span>
          <span className="text-xs font-medium">Email / Password</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Danger Zone ─────────────────────────────────────────────────────────── */
function DangerZone() {
  const [confirming, setConfirming] = useState(false);
  const [input, setInput] = useState("");

  return (
    <div className="bg-card border border-destructive/30 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Trash2 className="w-4 h-4 text-destructive" />
        <h2 className="text-sm font-semibold text-destructive">Danger Zone</h2>
      </div>

      {!confirming ? (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Delete Account</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Permanently delete your account and all associated data. This cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setConfirming(true)}
            className="ml-4 shrink-0 px-3 py-1.5 border border-destructive/40 text-destructive rounded-lg text-sm hover:bg-destructive/10 transition-colors"
          >
            Delete Account
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-destructive font-medium">Are you absolutely sure?</p>
          <p className="text-xs text-muted-foreground">
            This will permanently delete your account, all leads, campaigns, and integrations.
            Type <span className="font-mono font-bold text-foreground">DELETE</span> to confirm.
          </p>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="w-full px-3 py-2 bg-secondary border border-destructive/30 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-destructive"
          />
          <div className="flex gap-2">
            <button
              disabled={input !== "DELETE"}
              className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-40"
            >
              Permanently Delete
            </button>
            <button
              onClick={() => { setConfirming(false); setInput(""); }}
              className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
