"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";

interface CampaignTimingEditorProps {
  campaignId: string;
  followUp1DelayDays: number;
  followUp2DelayDays: number;
  canEdit: boolean; // false if campaign is COMPLETED
}

export function CampaignTimingEditor({
  campaignId,
  followUp1DelayDays: initialFu1,
  followUp2DelayDays: initialFu2,
  canEdit,
}: CampaignTimingEditorProps) {
  const router = useRouter();
  const [fu1, setFu1] = useState(initialFu1);
  const [fu2, setFu2] = useState(initialFu2);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isDirty = fu1 !== initialFu1 || fu2 !== initialFu2;

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/timing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followUp1DelayDays: fu1, followUp2DelayDays: fu2 }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Timeline dots */}
      <div className="flex items-center gap-0">
        {[
          { label: "Initial", day: "Day 0", color: "bg-primary" },
          { label: "Follow-up 1", day: `Day ${fu1}`, color: "bg-purple-500" },
          { label: "Follow-up 2", day: `Day ${fu2}`, color: "bg-indigo-500" },
        ].map((step, i, arr) => (
          <div key={step.label} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className={`w-2.5 h-2.5 rounded-full ${step.color}`} />
              <p className="text-xs font-medium text-center">{step.label}</p>
              <p className="text-[11px] text-muted-foreground">{step.day}</p>
            </div>
            {i < arr.length - 1 && <div className="h-px bg-border flex-1 mx-2 -mt-5" />}
          </div>
        ))}
      </div>

      {canEdit && (
        <div className="space-y-3 pt-2 border-t border-border">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Follow-up 1 delay</span>
              <span className="font-mono font-medium">Day {fu1}</span>
            </div>
            <input
              type="range"
              min={1}
              max={14}
              value={fu1}
              onChange={(e) => {
                const v = Number(e.target.value);
                setFu1(v);
                if (fu2 <= v) setFu2(v + 1);
              }}
              className="w-full accent-primary"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Follow-up 2 delay</span>
              <span className="font-mono font-medium">Day {fu2}</span>
            </div>
            <input
              type="range"
              min={fu1 + 1}
              max={30}
              value={fu2}
              onChange={(e) => setFu2(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          {isDirty && (
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : null}
              {saved ? "Saved!" : saving ? "Saving…" : "Save timing"}
            </button>
          )}

          <p className="text-xs text-muted-foreground">
            Changes apply to upcoming follow-ups. Already-scheduled steps are not affected.
          </p>
        </div>
      )}
    </div>
  );
}
