// Opak cursor-codec för cursor-paginerade list-portar (ADR-056).
//
// Klienten ser ALDRIG en backend-formad token. Denna codec namnger envelopen
// (`{ o }`) och base64:ar den, så Airtables `offset`-form aldrig läcker upp till
// klienten (opak-token-frikoppling — Slack Engineering-mönstret). Fas E:s
// Postgres-impl återanvänder samma codec med sin keyset-cursor i samma envelope,
// så klient-kontraktet är identiskt oavsett aktiv backend.

interface CursorEnvelope {
  /** Backend-token (Airtable offset nu; keyset-cursor Fas E). */
  o: string;
}

/** Wrappar en backend-token till en opak klient-cursor. */
export function encodeCursor(token: string): string {
  return btoa(JSON.stringify({ o: token } satisfies CursorEnvelope));
}

/**
 * Packar upp en opak klient-cursor till backend-token. Kastar `Invalid cursor`
 * vid manipulerad/felformad indata — callern mappar det till 400 (klient-fel).
 */
export function decodeCursor(cursor: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(atob(cursor));
  } catch {
    throw new Error('Invalid cursor');
  }
  if (
    !parsed ||
    typeof parsed !== 'object' ||
    typeof (parsed as Record<string, unknown>).o !== 'string'
  ) {
    throw new Error('Invalid cursor');
  }
  return (parsed as CursorEnvelope).o;
}
