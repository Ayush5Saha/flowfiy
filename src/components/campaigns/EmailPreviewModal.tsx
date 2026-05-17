"use client";

import { useState } from "react";
import { X, Copy, Check, Mail } from "lucide-react";

interface EmailPreviewModalProps {
  lead: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    companyName?: string | null;
  };
  outreachCopy: {
    subjectLine?: string | null;
    body: string;
    followUp1?: string | null;
    followUp2?: string | null;
  };
  followUp1DelayDays: number;
  followUp2DelayDays: number;
  onClose: () => void;
}

export function EmailPreviewModal({
  lead,
  outreachCopy,
  followUp1DelayDays,
  followUp2DelayDays,
  onClose,
}: EmailPreviewModalProps) {
  const [activeStep, setActiveStep] = useState<0 | 1 | 2>(0);
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const steps = [
    { label: "Initial Email", day: "Day 0", subject: outreachCopy.subjectLine, body: outreachCopy.body },
    { label: "Follow-up 1", day: `Day ${followUp1DelayDays}`, subject: `Re: ${outreachCopy.subjectLine ?? ""}`, body: outreachCopy.followUp1 },
    { label: "Follow-up 2", day: `Day ${followUp2DelayDays}`, subject: `Re: ${outreachCopy.subjectLine ?? ""}`, body: outreachCopy.followUp2 },
  ].filter((s) => s.body);

  const current = steps[activeStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Email Preview — {lead.firstName} {lead.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{lead.email} · {lead.companyName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step tabs */}
        <div className="flex border-b border-border px-5 gap-1 pt-1">
          {steps.map((step, i) => (
            <button
              key={step.label}
              onClick={() => setActiveStep(i as 0 | 1 | 2)}
              className={`px-3 py-2 text-xs rounded-t-md transition-colors ${
                activeStep === i
                  ? "text-foreground border-b-2 border-primary -mb-px"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {step.label}
              <span className="ml-1.5 text-[10px] text-muted-foreground">{step.day}</span>
            </button>
          ))}
        </div>

        {/* Email content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {current && (
            <>
              {/* Subject */}
              <div className="bg-secondary/50 border border-border rounded-lg p-3 group">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-muted-foreground font-medium">Subject</p>
                  <button
                    onClick={() => void copy(current.subject ?? "", "subject")}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all"
                  >
                    {copied === "subject" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-sm font-medium">{current.subject}</p>
              </div>

              {/* Body */}
              <div className="bg-secondary/50 border border-border rounded-lg p-3 group">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-muted-foreground font-medium">Email Body</p>
                  <button
                    onClick={() => void copy(current.body ?? "", "body")}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all"
                  >
                    {copied === "body" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{current.body}</p>
              </div>

              {/* Copy all button */}
              <div className="flex justify-end">
                <button
                  onClick={() => void copy(`Subject: ${current.subject ?? ""}\n\n${current.body ?? ""}`, "all")}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied === "all" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === "all" ? "Copied!" : "Copy subject + body"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
