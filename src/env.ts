import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

/**
 * [GA] Validera env-variabler vid uppstart.
 *
 * Kraschar direkt om något saknas eller har fel format — inga `undefined`-
 * fel vid runtime. Importera denna modul från `src/main.tsx` så uppstarten
 * kraschar innan React mountas.
 */
export const env = createEnv({
  clientPrefix: 'VITE_',
  client: {
    VITE_SUPABASE_URL: z.string().url(),
    VITE_SUPABASE_ANON_KEY: z.string().min(1),
    // Sentry DSN är optional — initieras bara i prod/staging där
    // den är satt. Lokal dev körs utan Sentry för att inte spam:a
    // Sentry-kvoten med utvecklings-fel.
    VITE_SENTRY_DSN: z.string().url().optional(),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
});
