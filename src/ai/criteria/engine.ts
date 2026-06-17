/**
 * Criteria engine — evaluates the deterministic predicate tiers (attribute +
 * signal) against a normalized lead. `source` predicates are applied at query
 * time; `judge` predicates are deferred to the LLM in qualification (returned as
 * judgeFields). Hard predicates filter; soft predicates feed the score.
 */
import type { Predicate, CriteriaMatch } from "./types";
import type { NormalizedLead } from "@/ai/actors/registry";
import type { WebsiteAudit } from "@/lib/website-audit";

export interface LeadSignals {
  websiteAudit?: WebsiteAudit;
}

function parseSize(size: string | null): number | null {
  if (!size) return null;
  const m = size.replace(/,/g, "").match(/\d+/);
  return m ? Number(m[0]) : null;
}

/** Canonical field → value getter. Unknown fields resolve to undefined. */
const FIELD_GETTERS: Record<string, (lead: NormalizedLead, signals: LeadSignals) => unknown> = {
  websiteStatus: (_l, s) => s.websiteAudit?.status,
  websiteScore:  (_l, s) => s.websiteAudit?.score,
  hasWebsite:    (l) => !!l.companyWebsite,
  hasEmail:      (l) => !!l.email,
  hasPhone:      (l) => !!l.phone,
  hasLinkedin:   (l) => !!l.linkedinUrl,
  rating:        (l) => l.rating,
  reviewsCount:  (l) => l.reviewsCount,
  industry:      (l) => l.industry,
  category:      (l) => l.industry,
  city:          (l) => l.city,
  companyName:   (l) => l.companyName,
  title:         (l) => l.title,
  companySize:   (l) => parseSize(l.companySize),
};

export function isComputableField(field: string): boolean {
  return field in FIELD_GETTERS;
}

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v.replace(/,/g, ""));
  return NaN;
}

function looseEq(a: unknown, b: unknown): boolean {
  if (typeof a === "boolean" || typeof b === "boolean") return Boolean(a) === Boolean(b);
  if (typeof a === "number" || typeof b === "number") return toNum(a) === toNum(b);
  return String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();
}

function evalPredicate(p: Predicate, value: unknown): boolean {
  switch (p.op) {
    case "exists":     return value !== null && value !== undefined && value !== "" && value !== false;
    case "not_exists": return value === null || value === undefined || value === "" || value === false;
    case "eq":         return looseEq(value, p.value);
    case "neq":        return !looseEq(value, p.value);
    case "lt":         return toNum(value) < toNum(p.value);
    case "lte":        return toNum(value) <= toNum(p.value);
    case "gt":         return toNum(value) > toNum(p.value);
    case "gte":        return toNum(value) >= toNum(p.value);
    case "between": {
      const arr = Array.isArray(p.value) ? p.value : [];
      const n = toNum(value);
      return n >= toNum(arr[0]) && n <= toNum(arr[1]);
    }
    case "in":
      return Array.isArray(p.value) && p.value.some((x) => looseEq(value, x));
    case "contains":
      return String(value ?? "").toLowerCase().includes(String(p.value ?? "").toLowerCase());
    case "matches":
      try { return new RegExp(String(p.value), "i").test(String(value ?? "")); }
      catch { return false; }
    default:
      return false;
  }
}

/** Which signal providers (e.g. "website-audit") the criteria reference. */
export function signalProvidersFor(predicates: Predicate[]): Set<string> {
  const out = new Set<string>();
  for (const p of predicates) {
    if (p.evaluator.startsWith("signal:")) out.add(p.evaluator.slice("signal:".length));
  }
  return out;
}

/**
 * Evaluate the deterministic predicates for one lead.
 * - source        → skipped (applied at query time)
 * - judge / infeasible-but-feasible → collected into judgeFields for the LLM step
 * - attribute / signal → evaluated here; hard failures flip passedHard
 */
export function evaluateLead(
  lead: NormalizedLead,
  signals: LeadSignals,
  predicates: Predicate[]
): CriteriaMatch {
  const matched: CriteriaMatch["matched"] = [];
  const judgeFields: string[] = [];
  let passedHard = true;
  let softWeight = 0;
  let softHit = 0;

  for (const p of predicates) {
    if (p.evaluator === "source") continue;
    if (p.evaluator === "judge" || !p.feasible) {
      if (p.feasible) judgeFields.push(p.field);
      continue;
    }

    const value = (FIELD_GETTERS[p.field] ?? (() => undefined))(lead, signals);
    const ok = evalPredicate(p, value);
    matched.push({ field: p.field, ok, detail: String(value ?? "—") });

    if (p.hard && !ok) passedHard = false;
    if (!p.hard) {
      const w = p.weight ?? 1;
      softWeight += w;
      if (ok) softHit += w;
    }
  }

  const softScore = softWeight > 0 ? Math.round((softHit / softWeight) * 100) : 100;
  return { passedHard, softScore, matched, judgeFields };
}
