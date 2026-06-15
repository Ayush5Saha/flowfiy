"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Check, ChevronDown, ChevronUp, X, Zap } from "lucide-react";

interface ChecklistStep {
  id: string;
  label: string;
  description: string;
  href: string;
  done: boolean;
}

interface Props {
  steps: ChecklistStep[];
  organizationId: string;
  guideHref?: string;
}

export function OnboardingChecklist({ steps, organizationId, guideHref }: Props) {
  const storageKey = `checklist-dismissed-${organizationId}`;
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDismissed(localStorage.getItem(storageKey) === "1");
  }, [storageKey]);

  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  const allDone = completed === total;
  const pct = Math.round((completed / total) * 100);

  function handleDismiss() {
    localStorage.setItem(storageKey, "1");
    setDismissed(true);
  }

  // Don't render until mounted (avoids hydration mismatch with localStorage)
  if (!mounted) return null;
  if (dismissed) return null;
  if (allDone) return null;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-6">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">
              Get started — {completed}/{total} steps complete
            </p>
            <p className="text-xs text-muted-foreground">
              {allDone ? "You're all set!" : "Complete setup to start generating leads"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {guideHref && (
            <Link
              href={guideHref}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium mr-1"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Setup guide
            </Link>
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-3">
        <div className="w-full bg-secondary rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full bg-primary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      {!collapsed && (
        <div className="px-5 pb-5 space-y-2">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                step.done
                  ? "opacity-50"
                  : "hover:bg-secondary/50 cursor-pointer group"
              }`}
            >
              {/* Step number / check */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-medium ${
                step.done
                  ? "bg-primary text-primary-foreground"
                  : "border-2 border-border text-muted-foreground"
              }`}>
                {step.done ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>

              {/* Label + description */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${step.done ? "line-through text-muted-foreground" : ""}`}>
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
              </div>

              {/* Action link */}
              {!step.done && (
                <Link
                  href={step.href}
                  className="shrink-0 text-xs text-primary hover:underline font-medium mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Go →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
