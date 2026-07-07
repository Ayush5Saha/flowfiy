"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Sparkles } from "lucide-react";
import { FounderEnrichModal } from "@/components/leads/FounderEnrichModal";

interface FounderEnrichRowButtonProps {
  listId: string;
  organizationId: string;
  leadId: string;
  /** Already has a found founder email on this lead. */
  enriched: boolean;
  /** Can this lead be enriched (has a company, not attempted, no decision-maker email yet). */
  eligible: boolean;
}

const ROW_POLL_INTERVAL_MS = 6000;
const ROW_POLL_COUNT = 5;

export function FounderEnrichRowButton({ listId, organizationId, leadId, enriched, eligible }: FounderEnrichRowButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear any in-flight polling interval on unmount (e.g. row filtered out).
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function startPolling() {
    if (pollRef.current) clearInterval(pollRef.current);
    let count = 0;
    pollRef.current = setInterval(() => {
      router.refresh();
      count += 1;
      if (count >= ROW_POLL_COUNT && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, ROW_POLL_INTERVAL_MS);
  }

  if (enriched) {
    return (
      <span className="flex items-center gap-1 text-green-400 text-[11px] font-medium">
        <CheckCircle className="w-3 h-3" />
        Founder ✓
      </span>
    );
  }

  if (!eligible) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Get this founder's email"
        aria-label="Get this founder's email"
        className="p-1 -m-1 text-blue-400 hover:text-blue-300 transition-colors"
      >
        <Sparkles className="w-3.5 h-3.5" />
      </button>

      <FounderEnrichModal
        open={open}
        onClose={() => setOpen(false)}
        listId={listId}
        organizationId={organizationId}
        leadIds={[leadId]}
        title="Get this founder's email"
        onDone={startPolling}
      />
    </>
  );
}
