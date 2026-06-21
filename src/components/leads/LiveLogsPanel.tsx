"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal, CheckCircle2, XCircle, Wrench, Loader2 } from "lucide-react";

interface LogEntry {
  ts: number;
  level: "info" | "success" | "error" | "tool";
  msg: string;
}

interface LiveLogsPanelProps {
  listId: string;
  initialStatus: string;
  initialPaused?: boolean;
}

const POLL_INTERVAL_MS = 2000;

const levelIcon: Record<LogEntry["level"], React.ReactNode> = {
  info: <span className="w-2 h-2 rounded-full bg-blue-400/70 shrink-0 mt-1.5" />,
  success: <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />,
  error: <XCircle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />,
  tool: <Wrench className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />,
};

const levelText: Record<LogEntry["level"], string> = {
  info: "text-muted-foreground",
  success: "text-green-400",
  error: "text-destructive",
  tool: "text-violet-300",
};

export function LiveLogsPanel({ listId, initialStatus, initialPaused = false }: LiveLogsPanelProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [listStatus, setListStatus] = useState(initialStatus);
  const [paused, setPaused] = useState(initialPaused);
  const [error, setError] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  // A paused run isn't actively producing logs — show it as paused, not "Live".
  const isActive = ["QUEUED", "RESEARCHING"].includes(listStatus) && !paused;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      let stillActive = false;
      try {
        const res = await fetch(`/api/leads/${listId}/logs`);
        if (!res.ok) { setError(true); return; }
        const data = await res.json() as { logs: LogEntry[]; listStatus: string; paused?: boolean };
        setLogs(data.logs);
        setListStatus(data.listStatus);
        setPaused(!!data.paused);
        setError(false);
        // Keep polling while the run is open (even if paused) so a resume/pause
        // toggle is reflected live — only the header label changes when paused.
        stillActive = ["QUEUED", "RESEARCHING"].includes(data.listStatus);
      } catch {
        setError(true);
      }

      if (stillActive) {
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    poll();
    return () => clearTimeout(timer);
  }, [listId]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  if (logs.length === 0 && !isActive) return null;

  return (
    <div className="bg-[#0d1117] border border-border rounded-xl overflow-hidden mb-6 font-mono">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-border bg-secondary/30">
        <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-sans">AI Pipeline Logs</span>
        {isActive && (
          <div className="flex items-center gap-1.5 ml-auto">
            <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
            <span className="text-[10px] text-blue-400 font-sans">Live</span>
          </div>
        )}
        {paused && ["QUEUED", "RESEARCHING"].includes(listStatus) && (
          <span className="ml-auto text-[10px] text-amber-400 font-sans">Paused</span>
        )}
        {!isActive && listStatus === "READY" && (
          <span className="ml-auto text-[10px] text-green-400 font-sans">Complete</span>
        )}
        {!isActive && listStatus === "FAILED" && (
          <span className="ml-auto text-[10px] text-destructive font-sans">Failed</span>
        )}
      </div>

      {/* Log entries */}
      <div className="max-h-72 overflow-y-auto px-4 py-3 space-y-1.5 text-xs">
        {logs.length === 0 && isActive && (
          <div className="flex items-center gap-2 text-muted-foreground py-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Waiting for pipeline to start...</span>
          </div>
        )}

        {logs.map((entry, i) => (
          <div key={i} className="flex items-start gap-2">
            {levelIcon[entry.level]}
            <div className="flex-1 min-w-0">
              <span className={levelText[entry.level]}>{entry.msg}</span>
              <span className="text-muted-foreground/40 ml-2 text-[10px]">
                {new Date(entry.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>
          </div>
        ))}

        {error && (
          <div className="text-muted-foreground/50 text-[10px] py-1">
            ⚠ Could not fetch logs — will retry
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
