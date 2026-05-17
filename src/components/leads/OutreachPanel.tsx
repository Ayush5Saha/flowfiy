"use client";

import { useState, useRef, useEffect } from "react";
import { X, Copy, Check, ExternalLink, Loader2, RefreshCw, Send, Bot, User, Megaphone, FlaskConical } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

interface Lead {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  title?: string | null;
  companyName?: string | null;
  companyWebsite?: string | null;
  industry?: string | null;
  status: string;
  qualificationScore?: number | null;
  research?: {
    opportunityAngle?: string | null;
    painPointMatch?: string | null;
    companyAnalysis?: unknown;
  } | null;
  outreachCopies?: Array<{
    id: string;
    subjectLine?: string | null;
    body: string;
    followUp1?: string | null;
    followUp2?: string | null;
    isApproved: boolean;
  }>;
}

interface OutreachPanelProps {
  lead: Lead;
  organizationId: string;
  onClose: () => void;
}

type Tab = "outreach" | "research" | "chat";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function OutreachPanel({ lead, organizationId, onClose }: OutreachPanelProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("outreach");
  const [copied, setCopied] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [currentCopy, setCurrentCopy] = useState(lead.outreachCopies?.[0]);

  // Chat state (declared before the reset effect so setters are in scope)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatStreaming, setChatStreaming] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // Reset all state when a different lead is selected
  useEffect(() => {
    setCurrentCopy(lead.outreachCopies?.[0]);
    setTab("outreach");
    setCopied(null);
    setChatMessages([]);
    setChatInput("");
  }, [lead.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  async function handleChatSend() {
    const message = chatInput.trim();
    if (!message || chatStreaming) return;

    const userMsg: ChatMessage = { role: "user", content: message };
    const history = chatMessages.slice(-18); // keep last 18 for context
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatStreaming(true);

    // Placeholder assistant message to stream into
    setChatMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/leads/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          organizationId,
          message,
          history,
        }),
      });

      if (!res.ok || !res.body) {
        setChatMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: "Sorry, something went wrong. Please try again." };
          return next;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const snap = accumulated;
        setChatMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: snap };
          return next;
        });
      }
    } finally {
      setChatStreaming(false);
      chatInputRef.current?.focus();
    }
  }

  const outreachCopy = currentCopy;
  const analysis = (lead.research?.companyAnalysis ?? {}) as Record<string, unknown>;
  const isQualified = lead.status === "QUALIFIED" || lead.status === "CONTACTED";

  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleRegenerate() {
    setRegenerating(true);
    const res = await fetch("/api/outreach/regenerate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead.id, organizationId }),
    });
    if (res.ok) {
      const data = await res.json() as { outreachCopy: typeof currentCopy };
      setCurrentCopy(data.outreachCopy);
      toast("Email copy regenerated", "success");
    } else {
      toast("Failed to regenerate copy", "error");
    }
    setRegenerating(false);
  }

  async function handleTestSend() {
    setSendingTest(true);
    try {
      const res = await fetch("/api/outreach/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id, organizationId }),
      });
      const data = await res.json() as { ok?: boolean; sentTo?: string; error?: string };
      if (res.ok) {
        toast(`Test email sent to ${data.sentTo ?? "your email"}`, "success");
      } else {
        toast(data.error ?? "Failed to send test email", "error");
      }
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setSendingTest(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <p className="text-sm font-medium">{lead.firstName} {lead.lastName}</p>
          <p className="text-xs text-muted-foreground">{lead.title} · {lead.companyName}</p>
        </div>
        <div className="flex items-center gap-2">
          {lead.companyWebsite && (
            <a
              href={lead.companyWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(["outreach", "research", "chat"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium transition-colors capitalize ${
              tab === t
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "chat" ? "AI Chat" : t}
          </button>
        ))}
      </div>

      {/* Chat tab — separate layout outside the scroll div */}
      {tab === "chat" && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Message list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center py-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center mx-auto">
                  <Bot className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Ask anything about this lead</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-52 mx-auto">Flowfiy has full context on the company research, scores, and your generated outreach.</p>
                </div>
                <div className="flex flex-col gap-1.5 text-left">
                  {[
                    "What's the best angle to approach this company?",
                    "Rewrite the email shorter and more casual",
                    "Why did this lead score so high?",
                    "What recent news should I mention?",
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => { setChatInput(prompt); chatInputRef.current?.focus(); }}
                      className="text-xs text-left px-3 py-2 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-secondary border border-border rounded-tl-sm"
                }`}>
                  {msg.content}
                  {msg.role === "assistant" && msg.content === "" && chatStreaming && (
                    <span className="inline-flex gap-0.5 ml-1">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            <div className="flex gap-2 items-end">
              <textarea
                ref={chatInputRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleChatSend(); }
                }}
                placeholder="Ask about this lead... (Enter to send)"
                rows={2}
                className="flex-1 resize-none bg-secondary border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
              />
              <button
                onClick={() => void handleChatSend()}
                disabled={!chatInput.trim() || chatStreaming}
                className="p-2.5 bg-primary rounded-lg text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 shrink-0"
              >
                {chatStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">Uses your Flowfiy API key · Shift+Enter for new line</p>
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${tab === "chat" ? "hidden" : ""}`}>
        {tab === "outreach" ? (
          outreachCopy ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email Outreach</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => void handleTestSend()}
                    disabled={sendingTest || regenerating}
                    title="Send test email to yourself"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {sendingTest ? <Loader2 className="w-3 h-3 animate-spin" /> : <FlaskConical className="w-3 h-3" />}
                    Test
                  </button>
                  <button
                    onClick={() => void handleRegenerate()}
                    disabled={regenerating || sendingTest}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {regenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    Regenerate
                  </button>
                </div>
              </div>

              <OutreachBlock
                label="Subject Line"
                content={outreachCopy.subjectLine ?? ""}
                copyKey="subject"
                copied={copied}
                onCopy={copyText}
              />
              <OutreachBlock
                label="Email Body"
                content={outreachCopy.body}
                copyKey="body"
                copied={copied}
                onCopy={copyText}
              />
              {outreachCopy.followUp1 && (
                <OutreachBlock
                  label="Follow-up 1"
                  content={outreachCopy.followUp1}
                  copyKey="fu1"
                  copied={copied}
                  onCopy={copyText}
                />
              )}
              {outreachCopy.followUp2 && (
                <OutreachBlock
                  label="Follow-up 2"
                  content={outreachCopy.followUp2}
                  copyKey="fu2"
                  copied={copied}
                  onCopy={copyText}
                />
              )}

              {/* Add to campaign quick-action */}
              {isQualified && (
                <div className="pt-2 border-t border-border">
                  <a
                    href="/campaigns/new"
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Megaphone className="w-3 h-3 text-primary" />
                    </div>
                    Create a campaign with this lead list →
                  </a>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No outreach copy generated yet.</p>
              <p className="text-xs text-muted-foreground mt-1">
                {lead.status === "DISQUALIFIED"
                  ? "This lead was disqualified and no copy was generated."
                  : "Lead research is still in progress."}
              </p>
            </div>
          )
        ) : (
          /* Research tab */
          <div className="space-y-4">
            {lead.qualificationScore !== null && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Qualification Score</p>
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-mono font-bold ${(lead.qualificationScore ?? 0) >= 70 ? "text-green-400" : "text-muted-foreground"}`}>
                    {lead.qualificationScore}
                  </span>
                  <div className="flex-1 bg-secondary rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${(lead.qualificationScore ?? 0) >= 70 ? "bg-green-400" : "bg-muted-foreground"}`}
                      style={{ width: `${lead.qualificationScore}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {lead.research?.opportunityAngle && (
              <ResearchBlock label="Best Outreach Angle" content={lead.research.opportunityAngle} />
            )}

            {lead.research?.painPointMatch && (
              <ResearchBlock label="Pain Point Match" content={lead.research.painPointMatch} />
            )}

            {Array.isArray(analysis.acquisitionGaps) && (analysis.acquisitionGaps as string[]).length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Identified Growth Gaps</p>
                <ul className="space-y-1">
                  {(analysis.acquisitionGaps as string[] ?? []).map((gap: string, i: number) => (
                    <li key={i} className="text-xs flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                      {gap}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {typeof analysis.fitAssessment === "string" && (
              <ResearchBlock label="Fit Assessment" content={analysis.fitAssessment} />
            )}

            {lead.email && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-xs text-green-400 font-medium">Email Available</p>
                <p className="text-xs font-mono mt-0.5">{lead.email}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function OutreachBlock({
  label,
  content,
  copyKey,
  copied,
  onCopy,
}: {
  label: string;
  content: string;
  copyKey: string;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
}) {
  return (
    <div className="bg-secondary/50 border border-border rounded-lg p-3 group">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <button
          onClick={() => onCopy(content, copyKey)}
          className="text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
        >
          {copied === copyKey ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
      <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
    </div>
  );
}

function ResearchBlock({ label, content }: { label: string; content: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm leading-relaxed">{content}</p>
    </div>
  );
}
