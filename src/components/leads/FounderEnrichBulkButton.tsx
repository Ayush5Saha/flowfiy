"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { FounderEnrichModal } from "@/components/leads/FounderEnrichModal";

interface FounderEnrichBulkButtonProps {
  listId: string;
  organizationId: string;
  eligibleCount: number;
}

const POLL_INTERVAL_MS = 6000;
const POLL_DURATION_MS = 2 * 60 * 1000;

export function FounderEnrichBulkButton({ listId, organizationId, eligibleCount }: FounderEnrichBulkButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear any in-flight polling interval on unmount.
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function startPolling() {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => router.refresh(), POLL_INTERVAL_MS);
    setTimeout(() => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, POLL_DURATION_MS);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={eligibleCount === 0}
        title={eligibleCount === 0 ? "All leads already have a contact" : "Get founder emails"}
        className="flex items-center gap-1.5 border border-border rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Get founder emails{eligibleCount > 0 ? ` (${eligibleCount})` : ""}
      </button>

      <FounderEnrichModal
        open={open}
        onClose={() => setOpen(false)}
        listId={listId}
        organizationId={organizationId}
        title="Get founder emails"
        onDone={() => {
          router.refresh();
          startPolling();
        }}
      />
    </>
  );
}
