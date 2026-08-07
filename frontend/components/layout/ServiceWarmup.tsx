'use client';

import { useEffect } from 'react';
import { warmUpServices } from '@/lib/warmup';

/**
 * Renders nothing. Its only job is to fire warm-up pings to the
 * Render-hosted backend/ai-engine/chroma services once, on mount, without
 * blocking or affecting the page it's dropped into.
 */
export default function ServiceWarmup() {
  useEffect(() => {
    warmUpServices();
  }, []);

  return null;
}
