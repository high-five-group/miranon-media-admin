/**
 * Ren (Deno-fri) matchningslogik för CORS-originbeslutet (TASK-415.1).
 *
 * `cors.ts` prövar sedan TASK-415.1 en ANDRA, valfri källa efter den
 * befintliga exakta listan (`CORS_ALLOWED_ORIGINS`): en kommaseparerad
 * mönsterlista (`CORS_ALLOWED_ORIGIN_PATTERNS`) för Vercel-förhandsvisningarnas
 * växlande origins. Se docs/research/pr-forhandsvisningar-och-backend-
 * branschmonster-2026-09-06.md §4 för branschunderlaget.
 *
 * Modulen är medvetet Deno-fri av SAMMA skäl som airtable-retry.ts (TASK-53,
 * se den filens filhuvud): `cors.ts` läser `Deno.env.get(...)` direkt och kan
 * därför ALDRIG importeras i Node-testerna utan att fälla typecheck med
 * TS2304 "Cannot find name 'Deno'". Hela beslutslogiken bor därför här som
 * rena funktioner som tar listorna som PARAMETRAR — `cors.ts` blir en tunn
 * wrapper som läser env och delegerar hit (se `tsconfig.edge-shared.json`
 * för var gränsen mellan Deno-rörande och Deno-fri kod är dragen).
 *
 * ## Mönstersyntaxen
 *
 * `*` är det ENDA jokertecknet och matchar en godtycklig sekvens av tecken
 * som INTE innehåller `.` — samma separatorregel som Supabases egen
 * redirect-URL-dokumentation för Vercel-previews
 * (https://supabase.com/docs/guides/auth/redirect-urls: "matches any
 * sequence of non-separator characters", `.` och `/` är separatorer). Ett
 * mönster måste vara en HEL Origin-sträng — schema + host, ALDRIG path:
 * webbläsarens `Origin`-header bär aldrig path — och måste inledas med
 * `https://`.
 *
 * ## Fail-closed (kortets AC #1)
 *
 * Ett mönster som saknar minst ETT literalt (icke-wildcard) tecken i sin
 * host-del — bart `*`, `https://*`, `https://*.*` — ELLER som inte matchar
 * `https://<host>`-formen (fel schema, saknad host, bär path/query)
 * IGNORERAS: det hamnar i `rejectedPatterns` och matchar ALDRIG något. Ett
 * ogiltigt mönster faller aldrig tillbaka till "matcha allt".
 */

/** Ett mönster måste vara EXAKT `https://<host>` — aldrig path, query eller fragment. */
const HTTPS_ORIGIN_SHAPE = /^https:\/\/([^/?#]+)$/;

/** Regex-specialtecken som måste escapas i de literala segmenten mellan `*`. */
const REGEX_SPECIALS = /[.+?^${}()|[\]\\]/g;

function escapeRegExpLiteral(literal: string): string {
  return literal.replace(REGEX_SPECIALS, '\\$&');
}

/**
 * Har host-delen minst ETT alfanumeriskt tecken? (bart `*`, `*.*`, `**`,
 * eller ett host som bara består av `*`/`.`/`-` underkänns — `.` och `-` är
 * strukturella tecken, inte en identifierande literal domän-del.)
 */
function hasLiteralChar(host: string): boolean {
  return /[A-Za-z0-9]/.test(host);
}

/**
 * Delar en kommaseparerad env-sträng till en trimmad, tom-fri lista.
 * Delad av både den exakta listan och mönsterlistan i `cors.ts`.
 */
export function parseCommaSeparatedList(raw: string | undefined | null): string[] {
  return (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Kompilerar ETT mönster till en ankrad `RegExp`, eller `null` om mönstret är
 * ogiltigt (fail-closed — se filhuvudet).
 */
export function compileOriginPattern(pattern: string): RegExp | null {
  const trimmed = pattern.trim();
  const match = HTTPS_ORIGIN_SHAPE.exec(trimmed);
  if (!match) return null;

  const host = match[1];
  if (host.length === 0 || !hasLiteralChar(host)) return null;

  const body = host.split('*').map(escapeRegExpLiteral).join('[^.]*');
  return new RegExp(`^https://${body}$`);
}

export interface CompiledPatternList {
  /** Kompilerade, giltiga mönster — i samma ordning som de gavs in. */
  readonly compiled: RegExp[];
  /** Ursprungssträngarna för varje mönster som underkändes (för loggrad hos anroparen). */
  readonly rejected: string[];
}

/** Kompilerar en hel mönsterlista. Ogiltiga mönster hamnar i `rejected` — de fäller aldrig hela listan. */
export function compileOriginPatterns(rawPatterns: readonly string[]): CompiledPatternList {
  const compiled: RegExp[] = [];
  const rejected: string[] = [];
  for (const raw of rawPatterns) {
    const regex = compileOriginPattern(raw);
    if (regex) compiled.push(regex);
    else rejected.push(raw);
  }
  return { compiled, rejected };
}

/** Matchar en verklig Origin-sträng mot en REDAN kompilerad mönsterlista. */
export function matchesAnyPattern(origin: string, compiled: readonly RegExp[]): boolean {
  return compiled.some((regex) => regex.test(origin));
}

export interface OriginDecision {
  /** Är denna Origin tillåten — via exaktlistan eller ett giltigt mönster? */
  readonly allowed: boolean;
  /** Mönster som underkändes vid kompilering (fail-closed), för loggrad hos anroparen. */
  readonly rejectedPatterns: string[];
}

/**
 * Hela CORS-originbeslutet: exaktlistan prövas FÖRST, mönsterlistan EFTER
 * (kortets ordning). Speglar exakt vad `cors.ts`:s `isAllowedOrigin` gör,
 * fast som ren, injicerbar funktion — detta är den enda funktion testerna
 * behöver anropa för att täcka hela AC #1/#2-beslutsträdet.
 */
export function decideOrigin(
  origin: string | null | undefined,
  exactAllowlist: readonly string[],
  rawPatterns: readonly string[],
): OriginDecision {
  if (!origin) return { allowed: false, rejectedPatterns: [] };
  if (exactAllowlist.includes(origin)) return { allowed: true, rejectedPatterns: [] };
  if (rawPatterns.length === 0) return { allowed: false, rejectedPatterns: [] };

  const { compiled, rejected } = compileOriginPatterns(rawPatterns);
  return { allowed: matchesAnyPattern(origin, compiled), rejectedPatterns: rejected };
}
