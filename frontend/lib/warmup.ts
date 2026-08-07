/**
 * Render free-tier services (backend, ai-engine, chroma) spin down after
 * ~15 minutes of inactivity and take 30-60s to wake on the next request.
 *
 * This fires harmless, best-effort "wake up" pings to all three the moment
 * the landing page loads, so they're more likely to already be warm by the
 * time the user clicks "Connect GitHub" or "Index Repository". It does not
 * guarantee a warm service — a user who clicks within a second or two of
 * landing may still hit a cold start; this only shortens the odds/duration.
 */

const WARMUP_TIMEOUT_MS = 8000;

interface WarmupTarget {
  name: string;
  url: string;
}

function getWarmupTargets(): WarmupTarget[] {
  const targets: WarmupTarget[] = [];

  if (process.env.NEXT_PUBLIC_API_URL) {
    targets.push({
      name: 'backend',
      url: `${process.env.NEXT_PUBLIC_API_URL}/health`,
    });
  }

  if (process.env.NEXT_PUBLIC_AI_ENGINE_URL) {
    targets.push({
      name: 'ai-engine',
      url: `${process.env.NEXT_PUBLIC_AI_ENGINE_URL}/health`,
    });
  }

  if (process.env.NEXT_PUBLIC_CHROMA_URL) {
    // Chroma's own heartbeat route — it's a prebuilt image, not our code,
    // so we hit its existing endpoint rather than a custom /health.
    targets.push({
      name: 'chroma',
      url: `${process.env.NEXT_PUBLIC_CHROMA_URL}/api/v1/heartbeat`,
    });
  }

  return targets;
}

async function pingWithTimeout(target: WarmupTarget): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WARMUP_TIMEOUT_MS);

  try {
    await fetch(target.url, {
      method: 'GET',
      signal: controller.signal,
      // Warm-up pings don't need a fresh response and shouldn't be cached
      // by an intermediate layer either — this just avoids browser HTTP
      // cache short-circuiting the actual network request.
      cache: 'no-store',
    });
  } catch {
    // Intentionally ignored — a failed/timed-out warm-up ping is not an
    // error condition. The service may still be waking up, or may wake
    // from this very request even if the response never comes back to us.
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fire-and-forget warm-up of all configured Render services. Never throws,
 * never blocks, and never surfaces errors — call this and move on.
 */
export function warmUpServices(): void {
  const targets = getWarmupTargets();
  if (targets.length === 0) return;

  // Promise.allSettled so one slow/failed target never affects the others,
  // and the overall call never rejects.
  void Promise.allSettled(targets.map(pingWithTimeout));
}
