import type { SegmentMember } from '../domain/schemas';

/**
 * SKOOL-export (Fas 6g L4, ADR-062 beslut 4/6) — frys/export av ett segments
 * NUVARANDE medlemmar till en nedladdningsbar e-post-CSV för SKOOL bulk-invite.
 *
 * Snapshot-semantik: filen ÄR frysningen (ingen lagrad/materialiserad lista,
 * b6) — `buildSkoolExport` är en REN funktion (ingen DOM, ingen nedladdning,
 * ren sträng-retur), så den är unit-testbar utan webbläsare. Nedladdningen
 * (`downloadCsv`) är den enda sidoeffekten och hålls separerad.
 *
 * Consent-allokering (LÅST i docs/reference/segment-arkitektur.md): SKOOL är en
 * ACCESS-ström, inte en marknadsström → flaggan `Ej godkänd för mailutskick`
 * (buren av compute-segment) IGNORERAS här. Mail-consent-filtret hör 6h:s
 * send-gate till, inte access-grant-exporten. Filtrera ALDRIG på consent här.
 */

export type SkoolExport = {
  /** Färdig CSV-sträng (header + e-post-först-rader, CRLF, UTF-8). */
  csv: string;
  /** Antal unika personer med giltig e-post som kom MED i filen. */
  exportedCount: number;
  /** Antal personer som föll bort p.g.a. saknad/ogiltig e-post (räknas synligt). */
  excludedCount: number;
};

// SKOOL bulk-invite tar en e-post-CSV; den exakta kolumn-mappningen är INTE
// auktoritativt pinnad (ingen verifierad Skool-schema-källa). Robust e-post-
// först-form med engelska rubriker; Lotta verifierar mappningen vid första
// skarpa import (UI-hjälptext + BUILD-LOG-not). Hårdkoda ingen schema-detalj
// som säker.
const CSV_HEADER = 'email,name';

/**
 * Normaliserad e-post för dedup + giltighets-grind: trim + lowercase. Tomt
 * (whitespace-only) eller uppenbart ogiltigt (saknar '@') → null (exkluderas
 * + räknas). Ingen tyngre validering än '@' — målet är att fånga uppenbart
 * tomma/trasiga, inte att RFC-validera (det vore över-engineering här).
 */
function normalizeEmail(raw: string | null): string | null {
  if (raw === null) return null;
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.length === 0) return null;
  if (!trimmed.includes('@')) return null;
  return trimmed;
}

/** RFC 4180-cell: omslut i citattecken vid special-tecken; dubbla inre citattecken. */
function csvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Bygg SKOOL-export ur ett segments medlemmar (compute-segment-resultatets
 * `members`). Exkluderar e-post-lösa (räknas), deduplicerar på normaliserad
 * e-post (behåller FÖRSTA förekomsten), ignorerar consent-flaggan. Ren retur —
 * ingen sidoeffekt.
 */
export function buildSkoolExport(members: readonly SegmentMember[]): SkoolExport {
  const seen = new Set<string>();
  const rows: string[] = [];
  let excludedCount = 0;

  for (const member of members) {
    const email = normalizeEmail(member.email);
    if (email === null) {
      excludedCount += 1; // saknad/ogiltig e-post
      continue;
    }
    if (seen.has(email)) continue; // dedup på normaliserad e-post — behåll första
    seen.add(email);
    // E-post FÖRST; namn-kolumn blank-tolerant (formel-primärfält kan vara null).
    rows.push(`${csvCell(email)},${csvCell((member.namn ?? '').trim())}`);
  }

  const csv = [CSV_HEADER, ...rows].join('\r\n');
  return { csv, exportedCount: rows.length, excludedCount };
}

/** ASCII-translitterering av svenska tecken för ett fil-säkert slug-segment. */
const TRANSLITERATE: Record<string, string> = {
  å: 'a',
  ä: 'a',
  ö: 'o',
  é: 'e',
};

/**
 * Fil-säkert slug ur ett (ev. tomt/null) segment-namn: lowercase, svenska
 * tecken translittererade, allt utanför [a-z0-9] → bindestreck, kollapsat.
 * Tomt resultat → 'segment' (aldrig ett naket bindestreck-filnamn).
 */
function slugify(name: string | null): string {
  const lowered = (name ?? '').trim().toLowerCase();
  const transliterated = lowered.replace(/[åäöé]/g, (ch) => TRANSLITERATE[ch] ?? ch);
  const slug = transliterated.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug.length > 0 ? slug : 'segment';
}

/** Lokalt `YYYY-MM-DD` (export-dagen ingår i filnamnet — snapshot-stämpel). */
function formatYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** `skool-<segment-slug>-<YYYY-MM-DD>.csv`. Datum injiceras (testbart). */
export function skoolExportFilename(segmentName: string | null, date: Date): string {
  return `skool-${slugify(segmentName)}-${formatYmd(date)}.csv`;
}

/**
 * Trigga webbläsar-nedladdning av CSV:n (Blob + anchor). Enda sidoeffekten i
 * modulen — separerad från den rena `buildSkoolExport` så logiken testas utan
 * DOM. Plain UTF-8 utan BOM (ingen overifierad Skool-encoding-detalj antas).
 */
export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
