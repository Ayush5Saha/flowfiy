import { existsSync, readFileSync } from "fs";

/**
 * Populate process.env from .env.local (then .env) for contexts that don't
 * auto-load them:
 *  - the standalone BullMQ worker (runs under tsx, which loads no env files), and
 *  - a Next.js dev server that was started BEFORE a key was added to .env.local
 *    (Next reads env only at process start, so a hot-reload won't pick it up).
 *
 * Only fills UNSET vars, so real shell/host env always wins — in production
 * (e.g. Vercel) there is no .env.local, so this is a harmless no-op and the
 * platform-provided env is used unchanged.
 *
 * Returns the number of variables newly set.
 */
export function loadLocalEnv(): number {
  let set = 0;
  for (const file of [".env.local", ".env"]) {
    let contents: string;
    try {
      if (!existsSync(file)) continue;
      contents = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const line of contents.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
        set++;
      }
    }
  }
  return set;
}
