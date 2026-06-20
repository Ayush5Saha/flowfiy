/**
 * Load environment for the standalone worker process (runs under tsx, which does
 * NOT auto-load .env files). Import this FIRST in the worker entrypoint so env is
 * populated before any module reads it. See @/lib/load-local-env for details.
 */
import { loadLocalEnv } from "@/lib/load-local-env";

loadLocalEnv();
