"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";

interface GenerateLeadsButtonProps {
  organizationId: string;
  variant?: "default" | "primary";
}

export function GenerateLeadsButton({ organizationId, variant = "default" }: GenerateLeadsButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [leadsPerRun, setLeadsPerRun] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/leads/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, listName: name, listDescription: description, leadsPerRun }),
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 402) {
        setError("Generation limit reached. Please upgrade your plan.");
      } else if (res.status === 422) {
        setError(data.error ?? "Integration not configured");
      } else {
        setError(data.error ?? "Failed to start generation");
      }
      setLoading(false);
      return;
    }

    setOpen(false);
    setName("");
    setDescription("");
    router.push(`/leads/${data.leadList.id}`);
    router.refresh();
  }

  const btnClass = variant === "primary"
    ? "px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
    : "flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors";

  return (
    <>
      <button onClick={() => setOpen(true)} className={btnClass}>
        <Plus className="w-4 h-4" />
        Generate Leads
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-semibold mb-1">Generate Lead List</h2>
            <p className="text-muted-foreground text-sm mb-5">
              Flowfiy will research your ICP, find matching leads, analyze each company, and write personalized outreach.
            </p>

            <form onSubmit={handleGenerate} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5">List name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. SaaS founders Q1 2025"
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Description (optional)</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Targeting B2B SaaS companies 10-50 employees in US"
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Leads to generate: <span className="font-mono text-primary">{leadsPerRun}</span>
                </label>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={leadsPerRun}
                  onChange={(e) => setLeadsPerRun(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>5</span>
                  <span>50</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2 border border-border rounded-lg text-sm hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !name}
                  className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Starting...</>
                  ) : (
                    "Generate"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
